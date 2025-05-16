import { Component } from "react";
import { useParams } from "react-router-dom";
import tw from "twin.macro";
import { ApiGetService, ApiPutService, axiosApiServiceUpdateUser } from "../services/apiService";
import defaultProfileImage from "../assets/profile.png";
import { connect } from "react-redux";
import { loginSuccess } from "../store/authSlice";
import { UserUpdateRequestBody, validateUserUpdate } from "../utils/validationRules";
import { AppDispatch } from "../store";
import { withTranslation, WithTranslation } from "react-i18next";

const PageContainer = tw.div`p-4 max-w-2xl mx-auto`;
const SpinnerContainer = tw.div`text-center py-8`;
const Spinner = tw.div`w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;
const ErrorAlert = tw.div`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 text-center mx-auto max-w-md w-full`;
const SuccessAlert = tw.div`bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4 text-center mx-auto max-w-md w-full`;
const ProfileCardContainer = tw.div`bg-white rounded-lg shadow-md p-6`;
const ProfileImage = tw.img`w-32 h-32 rounded-full mx-auto mb-4`;
const ProfileName = tw.h2`text-2xl font-bold text-center mb-2`;
const ProfileEmail = tw.p`text-gray-600 text-center`;
const EditButton = tw.button`mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full`;
const CancelButton = tw.button`mt-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded w-full`;
const SaveButton = tw.button`mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full disabled:bg-green-300 disabled:cursor-not-allowed`;
const FormContainer = tw.form`mt-4 space-y-4`;
const FormGroup = tw.div`flex flex-col`;
const Label = tw.label`mb-1 text-sm font-medium text-gray-700`;
const Input = tw.input`p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500`;
const ErrorMessage = tw.div`text-red-600 text-sm mt-1`;
const ButtonContainer = tw.div`flex flex-col mt-4`;

interface UserPageProps extends WithTranslation {
  id: string;
  ApiGetService: ApiGetService;
  ApiPutService?: ApiPutService<UserUpdateRequestBody>;
  auth?: {
    isAuthenticated: boolean;
    user: {
      id: number;
      username: string;
    } | null;
    token: string | null;
  };
  dispatch: AppDispatch; // Properly typed dispatch function
}

interface User {
  id: number;
  username: string;
  email: string;
  image?: string | null;
}

interface UserPageState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isEditing: boolean;
  editForm: {
    username: string;
    email: string;
    image: string;
  };
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  successMessage: string | null;
}

class UserPage extends Component<UserPageProps, UserPageState> {
  // Set default props
  static defaultProps = {
    ApiPutService: axiosApiServiceUpdateUser
  };

  state: UserPageState = {
    user: null,
    loading: false,
    error: null,
    isEditing: false,
    editForm: {
      username: "",
      email: "",
      image: "",
    },
    validationErrors: {},
    isSubmitting: false,
    successMessage: null,
  };

  componentDidMount() {
    this.loadUser();
  }

  componentDidUpdate(prevProps: UserPageProps) {
    if (prevProps.id !== this.props.id) {
      this.loadUser();
    }
  }

  loadUser = async () => {
    this.setState({ loading: true, error: null });
    try {
      const user = await this.props.ApiGetService.get<User>(
        `/api/1.0/users/${this.props.id}`
      );
      this.setState({
        user,
        loading: false,
        // Initialize edit form with user data
        editForm: {
          username: user.username,
          email: user.email,
          image: user.image || "",
        }
      });
    } catch (error: any) {
      // Check if the error message is one of our known error keys
      const errorMessage = error.response?.data?.message || error.message;
      const translatedError =
        errorMessage === "User not found" ?
          this.props.t("profile.errors.userNotFound") :
        errorMessage === "Update failed" ?
          this.props.t("profile.errors.updateFailed") :
          errorMessage;

      this.setState({
        error: translatedError,
        loading: false,
      });
    }
  };

  // Fix the isOwnProfile method to correctly compare user IDs
  isOwnProfile = (): boolean => {
    const { auth } = this.props;
    const { user } = this.state;

    if (!auth?.isAuthenticated || !auth.user || !user) {
      return false;
    }

    // Ensure we're comparing numbers, not strings
    return Number(auth.user.id) === Number(user.id);
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

    this.setState((prevState) => ({
      editForm: {
        ...prevState.editForm,
        [name]: value,
      }
    }), () => {
      // Validate after state update
      this.validateField(name, value);
    });
  };

  // Add method to validate individual fields
  validateField = (fieldName: string, value: string): void => {
    const { editForm } = this.state;
    const validationErrors = validateUserUpdate({
      ...editForm,
      [fieldName]: value
    });

    this.setState((prevState) => ({
      validationErrors: {
        ...prevState.validationErrors,
        [fieldName]: validationErrors[fieldName] || ""
      }
    }));
  };

  // Update validateForm to display validation errors in the UI
  validateForm = (): boolean => {
    const { editForm } = this.state;
    const validationErrors = validateUserUpdate(editForm);

    this.setState({ validationErrors });

    return Object.keys(validationErrors).length === 0;
  };

  // Update handleSubmit to properly call the API service
  handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { editForm } = this.state;
    const { auth, ApiPutService, id } = this.props;

    // Validate form before submission
    if (!this.validateForm()) {
      return;
    }

    this.setState({ isSubmitting: true, successMessage: null });

    try {
      // Make API request to update profile using ApiPutService
      const response = await ApiPutService!.put<User>(
        `/api/1.0/users/${id}`,
        editForm
      );

      // Update state with new user data
      this.setState({
        user: response,
        isSubmitting: false,
        isEditing: false,
        successMessage: this.props.t("profile.successMessage"),
      });

      // Update Redux store if the updated user is the current logged-in user
      if (auth?.user && Number(auth.user.id) === Number(response.id)) {
        this.props.dispatch(
          loginSuccess({
            id: response.id,
            username: response.username,
            token: auth.token || "",
          })
        );
      }
    } catch (error: any) {
      // Handle validation errors from the server
      if (error.response?.data?.validationErrors) {
        this.setState({
          validationErrors: error.response.data.validationErrors,
          isSubmitting: false,
        });
      } else {
        // Check if the error message is one of our known error keys
        const errorMessage = error.response?.data?.message || error.message;
        const translatedError =
          errorMessage === "User not found" ?
            this.props.t("profile.errors.userNotFound") :
          errorMessage === "Update failed" ?
            this.props.t("profile.errors.updateFailed") :
            errorMessage;

        this.setState({
          error: translatedError,
          isSubmitting: false,
        });
      }
    }
  };

  renderEditForm() {
    const { editForm, isSubmitting, validationErrors } = this.state;
    const { t } = this.props;

    return (
      <FormContainer data-testid="edit-profile-form" onSubmit={this.handleSubmit}>
        <FormGroup>
          <Label htmlFor="username">{t("profile.username")}</Label>
          <Input
            id="username"
            name="username"
            value={editForm.username}
            onChange={this.handleInputChange}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            placeholder="https://example.com/image.jpg"
            data-testid="image-input"
          />
          {validationErrors.image && (
            <ErrorMessage data-testid="image-error">
              {validationErrors.image}
            </ErrorMessage>
          )}
        </FormGroup>

        <ButtonContainer>
          <SaveButton
            type="submit"
            disabled={isSubmitting}
            data-testid="save-profile-button"
          >
            {isSubmitting ? t("profile.saving") : t("profile.saveChanges")}
          </SaveButton>
          <CancelButton
            type="button"
            onClick={this.toggleEditMode}
            disabled={isSubmitting}
            data-testid="cancel-edit-button"
          >
            {t("profile.cancel")}
          </CancelButton>
        </ButtonContainer>
      </FormContainer>
    );
  }

  renderProfileCard() {
    const { user } = this.state;
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

        {this.isOwnProfile() && (
          <EditButton
            onClick={this.toggleEditMode}
            data-testid="edit-profile-button"
          >
            {t("profile.editProfile")}
          </EditButton>
        )}
      </ProfileCardContainer>
    );
  }

  renderContent() {
    const { loading, error, isEditing, successMessage } = this.state;

    if (loading) {
      return (
        <SpinnerContainer>
          <Spinner data-testid="spinner" />
        </SpinnerContainer>
      );
    }

    if (error) {
      return <ErrorAlert data-testid="error-message">{error}</ErrorAlert>;
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
      <PageContainer data-testid="user-page">
        {this.renderContent()}
      </PageContainer>
    );
  }
}

// Connect component to Redux store
const mapStateToProps = (state: { auth: UserPageProps['auth'] }) => ({
  auth: state.auth,
});

// Apply withTranslation to the component
const TranslatedUserPage = withTranslation()(UserPage);

// Connect to Redux store
const ConnectedUserPage = connect(mapStateToProps)(TranslatedUserPage);

// Functional wrapper for routing
export const UserPageWrapper = (props: {
  ApiGetService: ApiGetService,
  ApiPutService?: ApiPutService<UserUpdateRequestBody>
}) => {
  const { id } = useParams<{ id: string }>();
  return <ConnectedUserPage {...props} id={id || ""} />;
};

export default UserPageWrapper;
