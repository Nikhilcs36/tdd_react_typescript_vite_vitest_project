import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "ar", "ml"],
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      translation: {
        home: "Home",
        myProfile: "My Profile",
        signup: {
          title: "Sign Up",
          username: "Username",
          email: "E-mail",
          password: "Password",
          passwordRepeat: "Password Repeat",
          submit: "Sign Up",
          success: {
            message: "User created successfully!",
            verification: "Check your email for verification.",
          },
          errors: {
            "Username cannot be null": "Username is required.",
            "Must have min 4 and max 32 characters":
              "Username must be 4-32 characters.",
            "E-mail cannot be null": "Email is required.",
            "E-mail is not valid":
              "Enter a valid email (e.g., user@example.com).",
            "E-mail in use": "Email is already in use.",
            "Password cannot be null": "Password is required.",
            "Password must have at least 6 characters":
              "Password must be 6+ characters.",
            "Password must have at least 1 uppercase, 1 lowercase letter and 1 number":
              "Use upper, lower, and a number.",
            password_repeat_null: "Confirm your password.",
            password_mismatch: "Passwords don't match.",
          },
        },
        userlist: {
          title: "User List",
          buttonNext: "Next",
          buttonPrevious: "Previous",
          emptyPageMessage: "No users found",
        },
        login: {
          title: "Login",
          email: "E-mail",
          password: "Password",
          submit: "Login",
          errors: {
            email_required: "Email is required.",
            email_invalid: "Enter a valid email address.",
            password_required: "Password is required.",
            generic: "An unexpected error occurred.",
          },
        },
        logout: "Logout",
        profile: {
          username: "Username",
          email: "E-mail",
          imageUrl: "Profile Image URL",
          saving: "Saving...",
          saveChanges: "Save Changes",
          cancel: "Cancel",
          editProfile: "Edit Profile",
          successMessage: "Profile updated successfully",
          errors: {
            userNotFound: "User not found",
            updateFailed: "Update failed"
          }
        },
      },
    },
    ml: {
      // Malayalam
      translation: {
        home: "ഹോം",
        myProfile: "എന്റെ പ്രൊഫൈൽ",
        signup: {
          title: "രജിസ്റ്റർ ചെയ്യുക",
          username: "ഉപയോക്തൃനാമം",
          email: "ഇമെയിൽ",
          password: "പാസ്‌വേഡ്",
          passwordRepeat: "പാസ്‌വേഡ് ആവർത്തിക്കുക",
          submit: "രജിസ്റ്റർ ചെയ്യുക",
          success: {
            message: "ഉപയോക്താവിനെ വിജയകരമായി സൃഷ്ടിച്ചു!",
            verification: "സ്ഥിരീകരണത്തിനായി നിങ്ങളുടെ ഇമെയിൽ പരിശോധിക്കുക.",
          },
          errors: {
            "Username cannot be null": "ഉപയോക്തൃനാമം ആവശ്യമാണ്.",
            "Must have min 4 and max 32 characters":
              "ഉപയോക്തൃനാമം 4-32 പ്രതീകങ്ങൾ ആയിരിക്കണം.",
            "E-mail cannot be null": "ഇമെയിൽ ആവശ്യമാണ്.",
            "E-mail is not valid":
              "സാധുവായ ഇമെയിൽ നൽകുക (ഉദാ: user@example.com).",
            "E-mail in use": "ഇമെയിൽ ഇതിനകം ഉപയോഗത്തിലാണ്.",
            "Password cannot be null": "പാസ്‌വേഡ് ആവശ്യമാണ്.",
            "Password must have at least 6 characters":
              "പാസ്‌വേഡ് 6+ പ്രതീകങ്ങൾ ആയിരിക്കണം.",
            "Password must have at least 1 uppercase, 1 lowercase letter and 1 number":
              "ഒരു വലിയക്ഷരം, ചെറിയക്ഷരം, സംഖ്യ എന്നിവ ഉപയോഗിക്കുക.",
            password_repeat_null: "പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക.",
            password_mismatch: "പാസ്‌വേഡുകൾ യോജിക്കുന്നില്ല.",
          },
        },
        userlist: {
          title: "ഉപയോക്തൃ പട്ടിക",
          buttonNext: "അടുത്തത്",
          buttonPrevious: "മുമ്പത്തേത്",
          emptyPageMessage: "ഉപയോക്താക്കളെയൊന്നും കണ്ടെത്തിയില്ല",
        },
        login: {
          title: "ലോഗിൻ",
          email: "ഇമെയിൽ",
          password: "പാസ്‌വേഡ്",
          submit: "ലോഗിൻ",
          errors: {
            email_required: "ഇമെയിൽ ആവശ്യമാണ്.",
            email_invalid: "സാധുവായ ഇമെയിൽ വിലാസം നൽകുക.",
            password_required: "പാസ്‌വേഡ് ആവശ്യമാണ്.",
            generic: "ഒരു അപ്രതീക്ഷിത പിശക് സംഭവിച്ചു.",
          },
        },
        logout: "ലോഗ്ഔട്ട്",
        profile: {
          username: "ഉപയോക്തൃനാമം",
          email: "ഇമെയിൽ",
          imageUrl: "പ്രൊഫൈൽ ചിത്രത്തിന്റെ URL",
          saving: "സംരക്ഷിക്കുന്നു...",
          saveChanges: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
          cancel: "റദ്ദാക്കുക",
          editProfile: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
          successMessage: "പ്രൊഫൈൽ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു",
          errors: {
            userNotFound: "ഉപയോക്താവിനെ കണ്ടെത്തിയില്ല",
            updateFailed: "അപ്ഡേറ്റ് പരാജയപ്പെട്ടു"
          }
        },
      },
    },
    ar: {
      // Arabic (RTL)
      translation: {
        home: "الرئيسية",
        myProfile: "ملفي",
        signup: {
          title: "تسجيل حساب جديد",
          username: "اسم المستخدم",
          email: "البريد الإلكتروني",
          password: "كلمة المرور",
          passwordRepeat: "تأكيد كلمة المرور",
          submit: "تسجيل",
          success: {
            message: "تم إنشاء المستخدم بنجاح!",
            verification: "يرجى التحقق من بريدك الإلكتروني لإكمال التسجيل.",
          },
          errors: {
            "Username cannot be null": "يرجى إدخال اسم المستخدم.",
            "Must have min 4 and max 32 characters":
              "يجب أن يكون اسم المستخدم بين 4 و32 حرفًا.",
            "E-mail cannot be null": "يرجى إدخال البريد الإلكتروني.",
            "E-mail is not valid":
              "يرجى إدخال بريد إلكتروني صحيح (مثال: user@example.com).",
            "E-mail in use": "البريد الإلكتروني مستخدم مسبقًا.",
            "Password cannot be null": "يرجى إدخال كلمة المرور.",
            "Password must have at least 6 characters":
              "يجب أن تحتوي كلمة المرور على 6 أحرف على الأقل.",
            "Password must have at least 1 uppercase, 1 lowercase letter and 1 number":
              "يجب أن تحتوي على حرف كبير، حرف صغير، ورقم.",
            password_repeat_null: "يرجى تأكيد كلمة المرور.",
            password_mismatch: "كلمتا المرور غير متطابقتين.",
          },
        },
        userlist: {
          title: "قائمة المستخدمين",
          buttonNext: "التالي",
          buttonPrevious: "السابق",
          emptyPageMessage: "لم يتم العثور على أي مستخدمين",
        },
        login: {
          title: "تسجيل الدخول",
          email: "البريد الإلكتروني",
          password: "كلمة المرور",
          submit: "تسجيل الدخول",
          errors: {
            email_required: "يرجى إدخال البريد الإلكتروني.",
            email_invalid: "يرجى إدخال بريد إلكتروني صحيح.",
            password_required: "يرجى إدخال كلمة المرور.",
            generic: "حدث خطأ غير متوقع.",
          },
        },
        logout: "تسجيل الخروج",
        profile: {
          username: "اسم المستخدم",
          email: "البريد الإلكتروني",
          imageUrl: "رابط صورة الملف الشخصي",
          saving: "جاري الحفظ...",
          saveChanges: "حفظ",
          cancel: "إلغاء",
          editProfile: "تعديل الملف الشخصي",
          successMessage: "تم تحديث الملف الشخصي بنجاح",
          errors: {
            userNotFound: "لم يتم العثور على المستخدم",
            updateFailed: "فشل التحديث"
          }
        },
      },
    },
  },
});

i18n.on("languageChanged", (lng) => {
  const html = document.documentElement;
  html.lang = lng;
  html.dir = i18n.dir(lng); // This will set 'rtl' for Arabic
});

export default i18n;
