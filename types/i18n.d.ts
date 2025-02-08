import "react-i18next";
import type translation from "./i18n";

declare module "react-i18next" {
  interface CustomTypeOptions {
    resources: {
      translation: (typeof translation)["resources"];
    };
    returnNull: false;
  }
}
