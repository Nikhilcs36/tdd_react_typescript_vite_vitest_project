import React, { Component } from "react";
import { useNavigate } from "react-router-dom";
import tw from "twin.macro";
import {
  ApiGetService,
  ApiPutService,
  ApiDeleteService,
  axiosApiServiceUpdateUser,
  axiosApiServiceUpdateUserWithFile,
  axiosApiServiceDeleteUser,
  axiosApiServiceGetCurrentUser,
} from "../services/apiService";
import defaultProfileImage from "../assets/profile.png";
import { connect } from "react-redux";
import { logoutSuccess } from "../store/actions";
import { updateUserSuccess } from "../store/userSlice";
import {
  updateUserStart,
  updateUserFailure,
  clearUserError,
} from "../store/userSlice";
import {
  UserUpdateRequestBody,
  validateUserUpdate,
} from "../utils/validationRules";
import { AppDispatch, RootState } from "../store";
import { withTranslation, WithTranslation } from "react-i18next";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { AuthState } from "../store/authSlice";

const PageContainer = tw.div`p-4 max-w-2xl mx-auto dark:bg-dark-primary`;
const SpinnerContainer = tw.div`text-center py-8`;
const Spinner = tw.div`w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;
const ErrorAlert = tw.div`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 text-center mx-auto max-w-md w-full`;
const SuccessAlert = tw.div`bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4 text-center mx-auto max-w-md w-full`;
const ProfileCardContainer = tw.div`bg-white rounded-lg shadow-md p-6 dark:bg-dark-secondary`;
const ProfileImage = tw.img`w-32 h-32 rounded-full mx-auto mb-4`;
const ProfileName = tw.h2`text-2xl font-bold text-center mb-2 dark:text-dark-text`;
const ProfileEmail = tw.p`text-gray-600 text-center dark:text-dark-text`;
const EditButton = tw.button`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full`;
const CancelButton = tw.button`mt-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded w-full`;
const SaveButton = tw.button`mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full disabled:bg-green-300 disabled:cursor-not-allowed`;
const FormContainer = tw.form`mt-4 space-y-4`;
const FormGroup = tw.div`flex flex-col`;
const Label = tw.label`mb-1 text-sm font-medium text-gray-700 dark:text-dark-text`;
const Input = tw.input`p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-dark-accent dark:bg-dark-primary dark:text-dark-text`;
const ErrorMessage = tw.div`text-red-600 text-sm mt-1`;
const ButtonContainer = tw.div`flex flex-col mt-4`;
const DeleteButton = tw.button`mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full`;
const ConfirmDeleteContainer = tw.div`fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full`;
const ConfirmDeleteDialog = tw.div`relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white`;
const ConfirmDeleteTitle = tw.h3`text-lg font-bold mb-4`;
const ConfirmDeleteMessage = tw.p`mb-4`;
const ConfirmDeleteButtons = tw.div`flex justify-end`;
const ConfirmDeleteCancelButton = tw.button`bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2`;
const ConfirmDeleteConfirmButton = tw.button`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded`;

interface ProfilePageProps extends WithTranslation {
  ApiGetService: ApiGetService;
  ApiPutService?: ApiPutService<UserUpdateRequestBody>;
  ApiDeleteService?: ApiDeleteService;
  auth?: AuthState;
  user: {
    isLoading: boolean;
    error: string | null;
  };
  dispatch: AppDispatch;
  navigate: (path: string) => void;
}

interface User {
  id: number;
  username: string;
  email: string;
  image?: string | null;
}

interface ProfilePageState {
  user: User | null;
  isEditing: boolean;
  editForm: {
    username: string;
    email: string;
    image: string;
  };
  validationErrors: Record<string, string>;
  successMessage: string | null;
  showDeleteConfirmation: boolean;
  selectedFile: File | null;
  clearImage: boolean;
  imagePreviewUrl: string | null; // Store blob URL for cleanup
}

class ProfilePage extends Component<ProfilePageProps, ProfilePageState> {
  private fileInputRef: React.RefObject<HTMLInputElement>;

  constructor(props: ProfilePageProps) {
    super(props);
    this.fileInputRef = React.createRef<HTMLInputElement>();
  }
  // Set default props
  static defaultProps = {
    ApiGetService: axiosApiServiceGetCurrentUser,
    ApiPutService: axiosApiServiceUpdateUser,
    ApiDeleteService: axiosApiServiceDeleteUser,
  };

  state: ProfilePageState = {
    user: null,
    isEditing: false,
    editForm: {
      username: "",
      email: "",
      image: "",
    },
    validationErrors: {},
    successMessage: null,
    showDeleteConfirmation: false,
    selectedFile: null,
    clearImage: false,
    imagePreviewUrl: null, // Initialize image preview URL
  };

  private successTimeout: NodeJS.Timeout | null = null;

  componentDidMount() {
    this.loadUser();
  }

  componentWillUnmount() {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    // Clean up any blob URLs to prevent memory leaks
    if (this.state.imagePreviewUrl && URL.revokeObjectURL) {
      URL.revokeObjectURL(this.state.imagePreviewUrl);
    }
  }

  loadUser = async () => {
    this.props.dispatch(updateUserStart());
    try {
      const user = await this.props.ApiGetService.get<User>(API_ENDPOINTS.ME);
      this.props.dispatch(
        updateUserSuccess({ user: { ...user, image: user.image || null } })
      );
      this.setState({
        user,
        // Initialize edit form with user data
        editForm: {
          username: user.username,
          email: user.email,
          image: user.image || "",
        },
      });
    } catch (error: any) {
      // Check if the error message is one of our known error keys
      const errorMessage = error.response?.data?.detail || error.message;
      this.props.dispatch(updateUserFailure(errorMessage));
    }
  };

  // Toggle edit mode
  toggleEditMode = () => {
    const { user } = this.state;
    if (!user) return;

    this.setState((prevState) => ({
      isEditing: !prevState.isEditing,
      // Reset form data when entering edit mode
      editForm: {
        username: user.username,
        email: user.email,
        image: user.image || "",
      },
      validationErrors: {},
      successMessage: null,
    }));
  };

  // Update handleInputChange to validate on each change
  handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    this.setState(
      (prevState) => ({
        editForm: {
          ...prevState.editForm,
          [name]: value,
        },
      }),
      () => {
        // Validate after state update
        this.validateField(name, value);
      }
    );
  };

  // Add method to validate individual fields
  validateField = (fieldName: string, value: string): void => {
    const { editForm } = this.state;
    const validationErrors = validateUserUpdate({
      ...editForm,
      [fieldName]: value,
    });

    this.setState((prevState) => ({
      validationErrors: {
        ...prevState.validationErrors,
        [fieldName]: validationErrors[fieldName] || "",
      },
    }));
  };

  // Update validateForm to display validation errors in the UI
  validateForm = (): boolean => {
    const { editForm } = this.state;
    const validationErrors = validateUserUpdate(editForm);

    this.setState({ validationErrors });

    return Object.keys(validationErrors).length === 0;
  };

  // Check if there are any changes to the form
  hasChanges = (): boolean => {
    const { editForm, user, selectedFile, clearImage } = this.state;

    if (selectedFile) {
      return true; // File upload always counts as a change
    }

    if (clearImage) {
      return true; // Clearing image counts as a change
    }

    if (!user) {
      return false; // No user data yet
    }

    return (
      editForm.username !== user.username ||
      editForm.email !== user.email ||
      editForm.image !== (user.image || "")
    );
  };

  // Handle button click for clearing the image
  handleClearImageClick = () => {
    this.setState({
      clearImage: true,
      editForm: {
        ...this.state.editForm,
        image: "",
      },
    });
  };

  // Update handleSubmit to properly call the API service with file upload support
  handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { editForm, selectedFile, clearImage, user } = this.state;
    const { ApiPutService, dispatch } = this.props;

    // Validate form before submission
    if (!this.validateForm()) {
      return;
    }

    this.setState({ successMessage: null });
    dispatch(updateUserStart());

    try {
      let response: User;

      if (selectedFile) {
        // Use FormData for file upload
        const formData = new FormData();
        if (editForm.username !== user?.username) {
          formData.append("username", editForm.username);
        }
        if (editForm.email !== user?.email) {
          formData.append("email", editForm.email);
        }
        formData.append("image", selectedFile);

        // Use the file upload service
        response = await axiosApiServiceUpdateUserWithFile.put<User>(
          API_ENDPOINTS.ME,
          formData
        );
      } else {
        // Use regular JSON for non-file updates
        const partialUpdateData: Partial<UserUpdateRequestBody> = {};

        if (editForm.username !== user?.username) {
          partialUpdateData.username = editForm.username;
        }
        if (editForm.email !== user?.email) {
          partialUpdateData.email = editForm.email;
        }
        if (clearImage) {
          partialUpdateData.image = null;
        }

        // Only send request if there are changes
        if (Object.keys(partialUpdateData).length === 0) {
          this.setState({
            isEditing: false,
          });
          return;
        }

        response = await ApiPutService!.put<User>(
          API_ENDPOINTS.ME, // Use ME endpoint for updates
          partialUpdateData
        );
      }

      // Update state with new user data
      this.setState({
        user: response,
        isEditing: false,
        successMessage: this.props.t("profile.successMessage"),
        selectedFile: null, // Clear selected file after successful upload
        clearImage: false, // Uncheck the clear image checkbox
        imagePreviewUrl: null, // Clear image preview after successful upload
      });

      // Reset the file input's value using the ref
      if (this.fileInputRef.current) {
        this.fileInputRef.current.value = "";
      }

      // Clear any existing timeout and set new one
      if (this.successTimeout) {
        clearTimeout(this.successTimeout);
      }
      this.successTimeout = setTimeout(() => {
        this.setState({ successMessage: null });
      }, 3000);

      // Update Redux store with the updated user data
      dispatch(
        updateUserSuccess({
          user: {
            id: response.id,
            username: response.username,
            email: response.email,
            image: response.image || null,
          },
        })
      );
    } catch (error: any) {
      // Handle validation errors from the server
      if (error.response?.data?.validationErrors) {
        this.setState({
          validationErrors: error.response.data.validationErrors,
        });
      } else {
        // Check if the error message is one of our known error keys
        let errorMessage = error.response?.data?.detail || error.message;
        if (
          error.response?.data?.image &&
          Array.isArray(error.response.data.image) &&
          error.response.data.image.length > 0
        ) {
          errorMessage = error.response.data.image[0];
        }
        dispatch(updateUserFailure(errorMessage));
      }
    }
  };

  // Handle file selection for image upload
  handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    // Clean up previous blob URL if it exists
    if (this.state.imagePreviewUrl && URL.revokeObjectURL) {
      URL.revokeObjectURL(this.state.imagePreviewUrl);
    }

    // Create new blob URL for preview
    const imagePreviewUrl =
      file && URL.createObjectURL ? URL.createObjectURL(file) : null;

    this.setState({
      selectedFile: file,
      imagePreviewUrl,
    });

    // Clear previous error messages when a new file is selected
    if (this.props.user.error) {
      this.props.dispatch(clearUserError());
    }
  };

  // Delete functionality
  openDeleteConfirmation = () => {
    this.setState({ showDeleteConfirmation: true });
  };

  closeDeleteConfirmation = () => {
    this.setState({ showDeleteConfirmation: false });
  };

  handleDelete = async () => {
    this.closeDeleteConfirmation();
    this.props.dispatch(updateUserStart());
    try {
      await this.props.ApiDeleteService!.delete(
        API_ENDPOINTS.ME // Use ME endpoint for deletion
      );
      this.props.dispatch(logoutSuccess()); // Dispatch logout action
      if (this.state.user) {
        this.props.dispatch(
          updateUserSuccess({
            user: { ...this.state.user, image: this.state.user.image || null },
          })
        );
      }
      this.setState(
        {
          successMessage: this.props.t("profile.deleteSuccess"),
        },
        () => {
          // Clear existing timeout before setting new one
          if (this.successTimeout) {
            clearTimeout(this.successTimeout);
          }

          // Set timeout with navigation after message clear
          this.successTimeout = setTimeout(() => {
            this.setState({ successMessage: null });
            this.props.navigate("/");
          }, 3000);
        }
      );
    } catch (apiError: any) {
      const errorMessage = apiError.response?.data?.detail || apiError.message;
      this.props.dispatch(updateUserFailure(errorMessage));
    }
  };

  renderEditForm() {
    const { editForm, validationErrors } = this.state;
    const { t } = this.props;

    return (
      <FormContainer
        data-testid="edit-profile-form"
        onSubmit={this.handleSubmit}
      >
        <FormGroup>
          <Label htmlFor="username">{t("profile.username")}</Label>
          <Input
            id="username"
            name="username"
            value={editForm.username}
            onChange={this.handleInputChange}
            data-testid="username-input"
          />
          {validationErrors.username && (
            <ErrorMessage data-testid="username-error">
              {validationErrors.username}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="email">{t("profile.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={editForm.email}
            onChange={this.handleInputChange}
            data-testid="email-input"
          />
          {validationErrors.email && (
            <ErrorMessage data-testid="email-error">
              {validationErrors.email}
            </ErrorMessage>
          )}
        </FormGroup>

        <FormGroup>
          <Label htmlFor="image">{t("profile.imageUrl")}</Label>
          <Input
            id="image"
            name="image"
            value={editForm.image}
            onChange={this.handleInputChange}
            disabled={true} // Make image field read-only
            placeholder="https://example.com/image.jpg"
            data-testid="image-input"
            readOnly // Add readOnly attribute
          />
          <p className="mt-1 text-sm text-gray-500">
            {t("profile.imageUrlInfo")}
          </p>
        </FormGroup>

        <FormGroup>
          <button
            type="button"
            onClick={this.handleClearImageClick}
            disabled={!this.state.editForm.image}
            data-testid="clear-image-button"
            className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            {t("profile.removeProfileImage")}
          </button>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="imageFile">{t("profile.uploadProfileImage")}</Label>
          <div className="relative">
            <Input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/*"
              onChange={this.handleFileChange}
              data-testid="image-file-input"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              ref={this.fileInputRef} // Attach the ref here
            />
            <div className="flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200 dark:bg-dark-secondary dark:border-dark-accent dark:hover:bg-dark-primary">
              <span className="text-gray-700 dark:text-dark-text">
                {this.state.selectedFile
                  ? this.state.selectedFile.name
                  : t("fileInput.chooseFile")}
              </span>
            </div>
          </div>
          {!this.state.selectedFile && (
            <p className="mt-1 text-sm text-gray-500">
              {t("fileInput.noFileChosen")}
            </p>
          )}
          {this.state.imagePreviewUrl && (
            <div className="mt-2">
              <img
                src={this.state.imagePreviewUrl}
                alt="Preview"
                className="object-cover w-32 h-32 rounded"
                data-testid="image-preview"
              />
            </div>
          )}
        </FormGroup>

        {this.props.user.error && (
          <ErrorAlert data-testid="error-message">
            {this.props.t(`profile.errors.${this.props.user.error}`)}
          </ErrorAlert>
        )}

        <ButtonContainer>
          <SaveButton
            type="submit"
            disabled={!this.hasChanges()}
            data-testid="save-profile-button"
          >
            {t("profile.saveChanges")}
          </SaveButton>
          <CancelButton
            type="button"
            onClick={this.toggleEditMode}
            data-testid="cancel-edit-button"
          >
            {t("profile.cancel")}
          </CancelButton>
        </ButtonContainer>
      </FormContainer>
    );
  }

  renderProfileCard() {
    const { user, showDeleteConfirmation } = this.state;
    const { t } = this.props;
    if (!user) return null;

    return (
      <ProfileCardContainer>
        <ProfileImage
          src={user.image || defaultProfileImage}
          alt={user.username}
          data-testid="profile-image"
        />
        <ProfileName data-testid="username">{user.username}</ProfileName>
        <ProfileEmail data-testid="email">{user.email}</ProfileEmail>

        <EditButton
          onClick={this.toggleEditMode}
          data-testid="edit-profile-button"
        >
          {t("profile.editProfile")}
        </EditButton>

        <DeleteButton
          onClick={this.openDeleteConfirmation}
          data-testid="delete-profile-button"
        >
          {t("profile.deleteProfile")}
        </DeleteButton>

        {showDeleteConfirmation && (
          <ConfirmDeleteContainer data-testid="delete-confirmation-dialog">
            <ConfirmDeleteDialog>
              <ConfirmDeleteTitle>
                {t("profile.deleteConfirmationTitle")}
              </ConfirmDeleteTitle>
              <ConfirmDeleteMessage>
                {t("profile.deleteConfirmationMessage")}
              </ConfirmDeleteMessage>
              <ConfirmDeleteButtons>
                <ConfirmDeleteCancelButton
                  onClick={this.closeDeleteConfirmation}
                  data-testid="cancel-delete-button"
                >
                  {t("profile.cancel")}
                </ConfirmDeleteCancelButton>
                <ConfirmDeleteConfirmButton
                  onClick={this.handleDelete}
                  data-testid="confirm-delete-button"
                >
                  {t("profile.delete")}
                </ConfirmDeleteConfirmButton>
              </ConfirmDeleteButtons>
            </ConfirmDeleteDialog>
          </ConfirmDeleteContainer>
        )}
      </ProfileCardContainer>
    );
  }

  renderContent() {
    const { isEditing, successMessage } = this.state;
    const { isLoading, error } = this.props.user;
    const { t } = this.props;

    if (isLoading) {
      return (
        <SpinnerContainer>
          <Spinner data-testid="spinner" />
        </SpinnerContainer>
      );
    }

    if (error && !isEditing) {
      return (
        <ErrorAlert data-testid="error-message">
          {t(`profile.errors.${error}`)}
        </ErrorAlert>
      );
    }

    return (
      <>
        {successMessage && (
          <SuccessAlert data-testid="success-message">
            {successMessage}
          </SuccessAlert>
        )}
        {isEditing ? this.renderEditForm() : this.renderProfileCard()}
      </>
    );
  }

  render() {
    return (
      <PageContainer data-testid="profile-page">
        {this.renderContent()}
      </PageContainer>
    );
  }
}

// Connect component to Redux store
const mapStateToProps = (state: RootState) => ({
  auth: state.auth,
  user: state.user,
});

// Apply withTranslation to the component
const TranslatedProfilePage = withTranslation()(ProfilePage);

// Connect to Redux store
const ConnectedProfilePage = connect(mapStateToProps)(TranslatedProfilePage);

// Functional wrapper for routing
export const ProfilePageWrapper = (props: {
  ApiGetService?: ApiGetService;
  ApiPutService?: ApiPutService<UserUpdateRequestBody>;
  ApiDeleteService?: ApiDeleteService;
}) => {
  const navigate = useNavigate();
  return <ConnectedProfilePage {...props} navigate={navigate} />;
};

export default ProfilePageWrapper;
