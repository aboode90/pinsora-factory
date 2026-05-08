import webbrowser
import requests
import base64

# بيانات تطبيقك من الصورة التي أرسلتها
APP_ID = "1565761"
# الرابط الذي يجب أن تضعه في Pinterest Redirect URIs
REDIRECT_URI = "https://localhost"

# الصلاحيات المطلوبة للنشر
SCOPES = "boards:read,boards:write,pins:read,pins:write"

auth_url = f"https://www.pinterest.com/oauth/?client_id={APP_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope={SCOPES}"

print("\n--- Pinterest Token Generator ---")
print("1. تأكد أنك أضفت https://localhost في خانة Redirect URIs في موقع Pinterest.")
print("2. سيتم الآن فتح المتصفح لتسجيل الدخول والموافقة.")
print("-" * 30)

webbrowser.open(auth_url)

print("\nبعد الموافقة، سيتم تحويلك لصفحة خطأ أو صفحة فارغة تبدأ بـ https://localhost/?code=...")
print("انسخ الكود الموجود بعد كلمة code= من شريط العنوان في المتصفح وضعه هنا:")

auth_code = input("\nأدخل الكود هنا: ").strip()

# ملاحظة: ستحتاج لإدخال App Secret يدوياً هنا لأنه مخفي في الصورة
app_secret = input("أدخل App Secret Key الخاص بتطبيقك (الموجود تحت App ID): ").strip()

auth_str = f"{APP_ID}:{app_secret}"
encoded_auth = base64.b64encode(auth_str.encode()).decode()

token_url = "https://api.pinterest.com/v5/oauth/token"
headers = {
    "Authorization": f"Basic {encoded_auth}",
    "Content-Type": "application/x-www-form-urlencoded"
}
data = {
    "grant_type": "authorization_code",
    "code": auth_code,
    "redirect_uri": REDIRECT_URI
}

try:
    res = requests.post(token_url, headers=headers, data=data)
    token_data = res.json()
    if "access_token" in token_data:
        print("\n✅ تم بنجاح! التوكين الجديد الخاص بك هو:")
        print(token_data["access_token"])
        print("\nقم بنسخه ووضعه في ملف .env")
    else:
        print("\n❌ فشل الحصول على التوكين:")
        print(token_data)
except Exception as e:
    print(f"حدث خطأ: {e}")
