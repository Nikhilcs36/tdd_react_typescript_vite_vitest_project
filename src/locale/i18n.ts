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
        welcomeTitle: "Welcome to Your Dashboard",
        welcomeMessage: "Access your profile, view statistics, and manage your account.",
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
            "Username already exists": "Username already exists.",
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
          pageInfo: "Page {{current}} of {{total}} ({{count}} users)",
          emptyPageMessage: "No users found",
          loginRequiredMessage: "Please login to view users",
          accessDeniedTitle: "Access Denied",
          accessDeniedMessage: "You need administrator privileges to view the user list.",
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
            no_active_account:
              "No active account found with the given credentials.",
            generic: "An unexpected error occurred.",
          },
        },
        logout: {
          title: "Logout",
          logout_Success: "You have been logged out successfully",
        },
        profile: {
          username: "Username",
          email: "E-mail",
          imageUrl: "Profile Image Path",
          imageUrlInfo: "Image URL cannot be edited directly",
          uploadProfileImage: "Upload New Profile Image",
          saveChanges: "Save Changes",
          cancel: "Cancel",
          editProfile: "Edit Profile",
          successMessage: "Profile updated successfully",
          errors: {
            userNotFound: "User not found",
            "Invalid image format. Only JPG, JPEG, and PNG are allowed.":
              "Invalid image format. Only JPG, JPEG, and PNG are allowed.",
            "Image size cannot exceed 2097152 bytes.":
              "Image size cannot exceed 2MB.",
          },
          deleteProfile: "Delete Profile",
          deleteConfirmationTitle: "Delete Confirmation",
          deleteConfirmationMessage:
            "Are you sure you want to delete your profile?",
          delete: "Delete",
          deleteSuccess: "Account deleted successfully",
          removeProfileImage: "Remove Profile Image",
        },
        fileInput: {
          chooseFile: "Choose file",
          noFileChosen: "No file chosen",
        },
        errors: {
          title: {
            authentication: "Authentication Error",
            general: "Error",
          },
          retry: "Try Again",
          401: {
            token_invalid_or_expired: "Your session has expired. Please log in again.",
          },
          403: {
            permission_denied: "You don't have permission to perform this action.",
          },
          500: {
            internal_server_error: "Something went wrong on our end. Please try again later.",
          },
          network: {
            network_error: "Network connection failed. Please check your internet connection.",
          },
        },
        dashboard: {
          title: "Dashboard",
          user_stats: "User Statistics",
          total_logins: "Total Logins: {{count}} ({{successful}} success, {{failed}} failed)",
          last_login: "Last Login",
          login_trend: "Login Trend",
          error_loading_data: "Error loading dashboard data",
          loading: "Loading...",
          login_activity: "Login Activity",
          username: "Username",
          timestamp: "Timestamp",
          ip_address: "IP Address",
          user_agent: "User Agent",
          status: "Status",
          success: "Success",
          failed: "Failed",
          no_activity_data: "No login activity data available",
          login_trends: "Login Trends",
          login_comparison: "Login Comparison",
          login_distribution: "Login Distribution",
          error_loading_chart: "Error loading chart data",
          no_chart_data: "No chart data available",
          user_statistics: "User Statistics",
          recent_activity: "Recent Activity",
          visualizations: "Visualizations",
          admin_overview: "Admin Overview",
          admin_statistics: "Admin Statistics",
          total_users: "Total Users: {{count}}",
          active_users: "Active Users: {{count}}",
          filters: {
            allUsers: "All Users",
            regularUsers: "Regular Users",
            adminOnly: "Admin Only",
            me: "Me"
          },
          dateRange: {
            startDate: "Start Date",
            endDate: "End Date",
            clear: "Clear Dates"
          },
          user_list: {
            title: "Users",
            empty: "No users found",
            error_loading: "Error loading users"
          },
          user_selector: {
            label: "Select User",
            aria_label: "Select user for dashboard",
            error_loading: "Error loading users",
            no_users: "No users available"
          },
          chart_mode: {
            label: "Chart Mode",
            individual: "Individual",
            group: "Group"
          },
          user_not_found: "User not found",
          unauthorized_access: "Unauthorized access to dashboard data"
        },
      },
    },
    ml: {
      // Malayalam
      translation: {
        home: "ഹോം",
        welcomeTitle: "നിങ്ങളുടെ ഡാഷ്ബോർഡിലേക്ക് സ്വാഗതം",
        welcomeMessage: "നിങ്ങളുടെ പ്രൊഫൈൽ ആക്സസ് ചെയ്യുക, സ്ഥിതിവിവരക്കണക്കുകൾ കാണുക, നിങ്ങളുടെ അക്കൗണ്ട് മാനേജ് ചെയ്യുക.",
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
            "Username already exists": "ഉപയോക്തൃനാമം ഇതിനകം നിലവിലുണ്ട്.",
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
          pageInfo: "പേജ് {{current}} / {{total}} ({{count}} ഉപയോക്താക്കൾ)",
          emptyPageMessage: "ഉപയോക്താക്കളെയൊന്നും കണ്ടെത്തിയില്ല",
          loginRequiredMessage: "ഉപയോക്താക്കളെ കാണാൻ ദയവായി ലോഗിൻ ചെയ്യുക",
          accessDeniedTitle: "അക്സസ് നിഷേധിച്ചു",
          accessDeniedMessage: "ഉപയോക്തൃ പട്ടിക കാണാൻ നിങ്ങൾക്ക് അഡ്മിനിസ്ട്രേറ്റർ അനുമതികൾ ആവശ്യമാണ്.",
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
            no_active_account:
              "നൽകിയിട്ടുള്ള ക്രെഡൻഷ്യലുകൾ ഉപയോഗിച്ച് സജീവമായ അക്കൗണ്ട് കണ്ടെത്താനായില്ല",
            generic: "ഒരു അപ്രതീക്ഷിത പിശക് സംഭവിച്ചു.",
          },
        },
        logout: {
          title: "ലോഗ്ഔട്ട്",
          logout_Success: "നിങ്ങൾ വിജയകരമായി ലോഗ് ഔട്ട് ചെയ്തു",
        },
        profile: {
          username: "ഉപയോക്തൃനാമം",
          email: "ഇമെയിൽ",
          imageUrl: "പ്രൊഫൈൽ ചിത്രത്തിന്റെ പാത്ത്",
          imageUrlInfo: "ചിത്ര URL നേരിട്ട് എഡിറ്റ് ചെയ്യാൻ കഴിയില്ല",
          uploadProfileImage: "പുതിയ പ്രൊഫൈൽ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക",
          saveChanges: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
          cancel: "റദ്ദാക്കുക",
          editProfile: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
          successMessage: "പ്രൊഫൈൽ വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു",
          errors: {
            userNotFound: "ഉപയോക്താവിനെ കണ്ടെത്തിയില്ല",
            "Invalid image format. Only JPG, JPEG, and PNG are allowed.":
              "അസാധുവായ ചിത്ര ഫോർമാറ്റ്. JPG, JPEG, PNG എന്നിവ മാത്രം അനുവദനീയമാണ്.",
            "Image size cannot exceed 2097152 bytes.":
              "ചിത്രത്തിന്റെ വലുപ്പം 2MB കവിയാൻ പാടില്ല.",
          },
          deleteProfile: "പ്രൊഫൈൽ നീക്കം ചെയ്യുക",
          deleteConfirmationTitle: "നീക്കം ചെയ്യൽ സ്ഥിരീകരണം",
          deleteConfirmationMessage:
            "നിങ്ങളുടെ പ്രൊഫൈൽ ഇല്ലാതാക്കണമെന്ന് ഉറപ്പാണോ?",
          delete: "നീക്കം ചെയ്യുക",
          deleteSuccess: "അക്കൗണ്ട് വിജയകരമായി നീക്കം ചെയ്തു",
          removeProfileImage: "പ്രൊഫൈൽ ചിത്രം നീക്കം ചെയ്യുക",
        },
        fileInput: {
          chooseFile: "ഫയൽ തിരഞ്ഞെടുക്കുക",
          noFileChosen: "ഫയൽ തിരഞ്ഞെടുത്തിട്ടില്ല",
        },
        errors: {
          title: {
            authentication: "അധികാര പരിശോധന പിശക്",
            general: "പിശക്",
          },
          retry: "വീണ്ടും ശ്രമിക്കുക",
          401: {
            token_invalid_or_expired: "നിങ്ങളുടെ സെഷൻ കാലഹരണപ്പെട്ടിരിക്കുന്നു. ദയവായി വീണ്ടും ലോഗിൻ ചെയ്യുക.",
          },
          403: {
            permission_denied: "ഈ പ്രവർത്തനം നടത്താൻ നിങ്ങൾക്ക് അനുമതി ഇല്ല.",
          },
          500: {
            internal_server_error: "ഞങ്ങളുടെ ഭാഗത്ത് എന്തോ പിശക് സംഭവിച്ചു. ദയവായി പിന്നീട് വീണ്ടും ശ്രമിക്കുക.",
          },
          network: {
          network_error: "നെറ്റ്‌വർക്ക് കണക്ഷൻ പരാജയപ്പെട്ടു. ദയവായി നിങ്ങളുടെ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.",
          },
        },
        dashboard: {
          title: "ഡാഷ്ബോർഡ്",
          user_stats: "ഉപയോക്തൃ സ്ഥിതിവിവരക്കണക്കുകൾ",
          total_logins: "ആകെ ലോഗിനുകൾ: {{count}} ({{successful}} വിജയം, {{failed}} പരാജയം)",
          last_login: "അവസാന ലോഗിൻ",
          login_trend: "ലോഗിൻ ട്രെൻഡ്",
          error_loading_data: "ഡാഷ്ബോർഡ് ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പിശക്",
          loading: "ലോഡ് ചെയ്യുന്നു...",
          login_activity: "ലോഗിൻ പ്രവർത്തനം",
          username: "ഉപയോക്തൃനാമം",
          timestamp: "സമയമുദ്ര",
          ip_address: "ഐപി വിലാസം",
          user_agent: "ഉപയോക്തൃ ഏജന്റ്",
          status: "സ്ഥിതി",
          success: "വിജയം",
          failed: "പരാജയപ്പെട്ടു",
          no_activity_data: "ലോഗിൻ പ്രവർത്തന ഡാറ്റ ലഭ്യമല്ല",
          login_trends: "ലോഗിൻ ട്രെൻഡുകൾ",
          login_comparison: "ലോഗിൻ താരതമ്യം",
          login_distribution: "ലോഗിൻ വിതരണം",
          error_loading_chart: "ചാർട്ട് ഡാറ്റ ലോഡ് ചെയ്യുന്നതിൽ പിശക്",
          no_chart_data: "ചാർട്ട് ഡാറ്റ ലഭ്യമല്ല",
          user_statistics: "ഉപയോക്തൃ സ്ഥിതിവിവരക്കണക്കുകൾ",
          recent_activity: "സമീപകാല പ്രവർത്തനം",
          visualizations: "വിഷ്വലൈസേഷനുകൾ",
          admin_overview: "അഡ്മിൻ അവലോകനം",
          admin_statistics: "അഡ്മിൻ സ്ഥിതിവിവരക്കണക്കുകൾ",
          total_users: "ആകെ ഉപയോക്താക്കൾ: {{count}}",
          active_users: "സജീവ ഉപയോക്താക്കൾ: {{count}}",
          filters: {
            allUsers: "എല്ലാ ഉപയോക്താക്കളും",
            regularUsers: "സാധാരണ ഉപയോക്താക്കൾ",
            adminOnly: "അഡ്മിൻ മാത്രം",
            me: "ഞാൻ"
          },
          dateRange: {
            startDate: "ആരംഭ തീയതി",
            endDate: "അവസാന തീയതി",
            clear: "തീയതികൾ മായ്ക്കുക"
          },
          user_selector: {
            label: "ഉപയോക്താവിനെ തിരഞ്ഞെടുക്കുക",
            aria_label: "ഡാഷ്ബോർഡിനായി ഉപയോക്താവിനെ തിരഞ്ഞെടുക്കുക",
            error_loading: "ഉപയോക്താക്കളെ ലോഡ് ചെയ്യുന്നതിൽ പിശക്",
            no_users: "ഉപയോക്താക്കളെ ലഭ്യമല്ല"
          },
          chart_mode: {
            label: "ചാർട്ട് മോഡ്",
            individual: "വ്യക്തിഗതം",
            group: "ഗ്രൂപ്പ്"
          },
          user_not_found: "ഉപയോക്താവിനെ കണ്ടെത്തിയില്ല",
          unauthorized_access: "ഡാഷ്ബോർഡ് ഡാറ്റയിലേക്ക് അനധികൃത ആക്സസ്"
        },
      },
    },
    ar: {
      // Arabic (RTL)
      translation: {
        home: "الرئيسية",
        welcomeTitle: "مرحباً بك في لوحة التحكم الخاصة بك",
        welcomeMessage: "يمكنك الوصول إلى ملفك الشخصي وعرض الإحصائيات وإدارة حسابك.",
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
            "Username already exists": "اسم المستخدم موجود بالفعل.",
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
          pageInfo: "صفحة {{current}} من {{total}} ({{count}} مستخدمين)",
          emptyPageMessage: "لم يتم العثور على أي مستخدمين",
          loginRequiredMessage: "يرجى تسجيل الدخول لعرض المستخدمين",
          accessDeniedTitle: "تم رفض الوصول",
          accessDeniedMessage: "تحتاج إلى صلاحيات المسؤول لعرض قائمة المستخدمين.",
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
            no_active_account:
              "لم يتم العثور على حساب نشط ببيانات الاعتماد المقدمة",
            generic: "حدث خطأ غير متوقع.",
          },
        },
        logout: {
          title: "تسجيل الخروج",
          logout_Success: "لقد تم تسجيل خروجك بنجاح",
        },
        profile: {
          username: "اسم المستخدم",
          email: "البريد الإلكتروني",
          imageUrl: "مسار صورة الملف الشخصي",
          imageUrlInfo: "لا يمكن تعديل رابط الصورة مباشرة",
          uploadProfileImage: "تحميل صورة ملف شخصي جديدة",
          saveChanges: "حفظ",
          cancel: "إلغاء",
          editProfile: "تعديل الملف الشخصي",
          successMessage: "تم تحديث الملف الشخصي بنجاح",
          errors: {
            userNotFound: "لم يتم العثور على المستخدم",
            "Invalid image format. Only JPG, JPEG, and PNG are allowed.":
              "تنسيق الصورة غير صالح. يُسمح فقط بصيغ JPG وJPEG وPNG.",
            "Image size cannot exceed 2097152 bytes.":
              "لا يمكن أن يتجاوز حجم الصورة 2 ميجابايت.",
          },
          deleteProfile: "حذف الملف الشخصي",
          deleteConfirmationTitle: "تأكيد الحذف",
          deleteConfirmationMessage: "هل أنت متأكد أنك تريد حذف ملفك الشخصي؟",
          delete: "حذف",
          deleteSuccess: "تم حذف الحساب بنجاح",
          removeProfileImage: "إزالة صورة الملف الشخصي",
        },
        fileInput: {
          chooseFile: "اختر ملف",
          noFileChosen: "لم يتم اختيار ملف",
        },
        errors: {
          title: {
            authentication: "خطأ المصادقة",
            general: "خطأ",
          },
          retry: "حاول مرة أخرى",
          401: {
            token_invalid_or_expired: "انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.",
          },
          403: {
            permission_denied: "ليس لديك إذن لأداء هذا الإجراء.",
          },
          500: {
            internal_server_error: "حدث خطأ من جانبنا. يرجى المحاولة مرة أخرى لاحقًا.",
          },
          network: {
            network_error: "فشل الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت.",
          },
        },
        dashboard: {
          title: "لوحة التحكم",
          user_stats: "إحصائيات المستخدم",
          total_logins: "إجمالي عمليات تسجيل الدخول: {{count}} ({{successful}} نجح, {{failed}} فشل)",
          last_login: "آخر تسجيل دخول",
          login_trend: "اتجاه تسجيل الدخول",
          error_loading_data: "خطأ في تحميل بيانات لوحة التحكم",
          loading: "جاري التحميل...",
          login_activity: "نشاط تسجيل الدخول",
          username: "اسم المستخدم",
          timestamp: "الطابع الزمني",
          ip_address: "عنوان IP",
          user_agent: "وكيل المستخدم",
          status: "الحالة",
          success: "نجح",
          failed: "فشل",
          no_activity_data: "لا توجد بيانات نشاط تسجيل دخول متاحة",
          login_trends: "اتجاهات تسجيل الدخول",
          login_comparison: "مقارنة تسجيل الدخول",
          login_distribution: "توزيع تسجيل الدخول",
          error_loading_chart: "خطأ في تحميل بيانات الرسم البياني",
          no_chart_data: "لا توجد بيانات رسم بياني متاحة",
          user_statistics: "إحصائيات المستخدم",
          recent_activity: "النشاط الأخير",
          visualizations: "التصورات",
          admin_overview: "نظرة عامة للمسؤول",
          admin_statistics: "إحصائيات المسؤول",
          total_users: "إجمالي المستخدمين: {{count}}",
          active_users: "المستخدمون النشطون: {{count}}",
          filters: {
            allUsers: "جميع المستخدمين",
            regularUsers: "المستخدمون العاديون",
            adminOnly: "الإدارة فقط",
            me: "أنا"
          },
          dateRange: {
            startDate: "تاريخ البداية",
            endDate: "تاريخ النهاية",
            clear: "مسح التواريخ"
          },
          user_selector: {
            label: "اختر المستخدم",
            aria_label: "اختر مستخدم للوحة التحكم",
            error_loading: "خطأ في تحميل المستخدمين",
            no_users: "لا يوجد مستخدمون متاحون"
          },
          chart_mode: {
            label: "وضع الرسم البياني",
            individual: "فردي",
            group: "مجموعة"
          },
          user_not_found: "لم يتم العثور على المستخدم",
          unauthorized_access: "وصول غير مصرح به لبيانات لوحة التحكم"
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
