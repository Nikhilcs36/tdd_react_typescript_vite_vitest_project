import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import tw from "twin.macro";
import axios from "axios";

const SuccessMessage = tw.div`mt-3 p-3 text-green-700 bg-green-100 rounded text-center`;
const ErrorMessage = tw.div`mt-3 p-3 text-red-700 bg-red-100 rounded text-center`;
const Spinner = tw.div`mt-3 w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;

const AccountActivationPage = () => {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<"success" | "fail" | "">("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setResult("fail");
      return;
    }

    const activateAccount = async () => {
      setLoading(true);
      try {
        await axios.post(`/api/1.0/users/token/${token}`);
        setResult("success");
      } catch (error) {
        setResult("fail");
      } finally {
        setLoading(false);
      }
    };

    activateAccount();
  }, [token]);

  return (
    <div data-testid="activation-page">
      {loading && <Spinner data-testid="loading-spinner" />}
      {result === "success" && (
        <SuccessMessage data-testid="success-message">
          Account is Activated
        </SuccessMessage>
      )}
      {result === "fail" && (
        <ErrorMessage data-testid="fail-message">
          Activation failed
        </ErrorMessage>
      )}
    </div>
  );
};

export default AccountActivationPage;
