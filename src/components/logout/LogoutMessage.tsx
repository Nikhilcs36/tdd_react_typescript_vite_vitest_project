import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import tw from "twin.macro";
import styled from "styled-components";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { hideLogoutMessage } from "../../store/authSlice";

const AlertSuccess = styled.div`
  ${tw`relative flex items-center justify-center w-full max-w-md px-4 py-3 mx-auto mt-4 mb-4 text-green-700 bg-green-100 border border-green-400 rounded`}
`;

const LogoutMessage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const showMessage = useSelector(
    (state: RootState) => state.auth.showLogoutMessage
  );

  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        dispatch(hideLogoutMessage());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showMessage, dispatch]);

  if (!showMessage) return null;

  return (
    <AlertSuccess data-testid="logout-success-message">
      {t("logout.logoutSuccess")}
    </AlertSuccess>
  );
};

export default LogoutMessage;
