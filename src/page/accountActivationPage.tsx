import { useEffect, useState } from "react";
//import { useParams } from "react-router-dom";
import tw from "twin.macro";
import axios from "axios";
const SuccessMessage = tw.div`mt-3 p-3 text-green-700 bg-green-100 rounded text-center`;
const ErrorMessage = tw.div`mt-3 p-3 text-red-700 bg-red-100 rounded text-center`;

type Props = {
  token: string; // Explicitly define token as a required prop
};

const AccountActivationPage = ({ token }: Props) => {
  const [result, setResult] = useState<"success" | "fail" | "">("");

  useEffect(() => {
    if (!token) {
      setResult("fail"); // Directly fail if token is missing
      return;
    }
    const activateAccount = async () => {
      try {
        await axios.post(`/api/1.0/users/token/${token}`);
        setResult("success");
      } catch (error) {
        setResult("fail");
      }
    };

    activateAccount();
  }, [token]);

  return (
    <div data-testid="activation-page">
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
