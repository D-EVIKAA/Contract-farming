import { createContext, useContext, useState, useEffect, useCallback } from "react";

const LanguageContext = createContext(null);

// Comprehensive dictionary mapping English phrases and words to Hindi
export const translations = {
  // Navigation & Branding
  "Contract Farming Management System": "अनुबंध खेती प्रबंधन प्रणाली",
  "AgriContract": "एग्रीकॉन्ट्रैक्ट",
  "Contract Farming": "अनुबंध खेती",
  "Dashboard": "डैशबोर्ड",
  "Marketplace": "बाज़ार",
  "Progress": "प्रगति",
  "Insights": "अंतर्दृष्टि",
  "Disputes": "विवाद",
  "Activity": "गतिविधि",
  "Profile": "प्रोफ़ाइल",
  "Settings": "सेटिंग्स",
  "Log out": "लॉग आउट",
  "Log in": "लॉग इन",
  "Sign up": "साइन अप",
  "Login": "लॉग इन",
  "Register": "रजिस्टर",
  "Home": "होम",
  "Notifications": "सूचनाएं",
  "Search": "खोजें",
  "Search contracts, farmers, products...": "अनुबंध, किसान, उत्पाद खोजें...",
  "Ctrl + K": "Ctrl + K",

  // Roles
  "Farmer": "किसान",
  "Buyer": "खरीदार",
  "Admin": "व्यवस्थापक",
  "System Admin": "सिस्टम व्यवस्थापक",
  "Producer": "उत्पादक",
  "Commercial": "वाणिज्यिक",
  "Commercial Buyer": "वाणिज्यिक खरीदार",
  "Farmer (Producer)": "किसान (उत्पादक)",
  "Buyer (Commercial)": "खरीदार (वाणिज्यिक)",

  // Headings & Welcomes
  "Welcome back": "वापसी पर स्वागत",
  "Welcome back, ": "वापसी पर स्वागत, ",
  "System Command Center": "सिस्टम कमांड सेंटर",
  "System Administrator Control Dashboard": "सिस्टम व्यवस्थापक नियंत्रण डैशबोर्ड",
  "Full system governance, user verification queue, contract oversight, and dispute resolution.": "पूर्ण प्रणाली शासन, उपयोगकर्ता सत्यापन कतार, अनुबंध निरीक्षण, और विवाद समाधान।",
  "Join the contract farming ecosystem as a Producer (Farmer) or Commercial Buyer.": "उत्पादक (किसान) या वाणिज्यिक खरीदार के रूप में अनुबंध खेती पारिस्थितिकी तंत्र से जुड़ें।",
  "Create Your Account": "अपना खाता बनाएं",
  "Sign In to Your Account": "अपने खाते में साइन इन करें",
  "Access your dashboard, active contracts, and secure payments.": "अपने डैशबोर्ड, सक्रिय अनुबंधों और सुरक्षित भुगतानों तक पहुंचें।",

  // Action Buttons
  "Pay Now": "अभी भुगतान करें",
  "Pay": "भुगतान करें",
  "Accept": "स्वीकार करें",
  "Reject": "अस्वीकार करें",
  "View": "देखें",
  "Edit": "संपादित करें",
  "Delete": "हटाएं",
  "Save": "सहेजें",
  "Save Changes": "परिवर्तन सहेजें",
  "Save Profile Details": "प्रोफ़ाइल विवरण सहेजें",
  "Cancel": "रद्द करें",
  "Back": "वापस",
  "Next": "आगे",
  "Submit": "जमा करें",
  "Filter": "फ़िल्टर",
  "Reset Filter": "फ़िल्टर रीसेट करें",
  "New Contract": "नया अनुबंध",
  "Create Contract": "अनुबंध बनाएं",
  "Propose Contract": "अनुबंध प्रस्तावित करें",
  "Propose Contract Request": "अनुबंध अनुरोध प्रस्तावित करें",
  "Log Farm Progress": "कृषि प्रगति दर्ज करें",
  "Profile & Photos": "प्रोफ़ाइल और तस्वीरें",
  "Verify Profile": "प्रोफ़ाइल सत्यापित करें",
  "Verify via Aadhaar OTP": "आधार ओटीपी से सत्यापित करें",
  "Send OTP": "ओटीपी भेजें",
  "Get OTP Code": "ओटीपी कोड प्राप्त करें",
  "Verify OTP": "ओटीपी सत्यापित करें",
  "Verify & Complete": "सत्यापित करें और पूर्ण करें",
  "Resend OTP": "ओटीपी पुनः भेजें",
  "Change": "बदलें",
  "Change Aadhaar Number": "आधार संख्या बदलें",
  "Mark Ready": "तैयार चिह्नित करें",
  "Mark Ready for Delivery": "डिलीवरी के लिए तैयार चिह्नित करें",
  "Dispatch Crop": "फ़सल प्रेषित करें",
  "Confirm Delivery": "डिलीवरी की पुष्टि करें",
  "Confirm Payment": "भुगतान की पुष्टि करें",
  "Raise Dispute": "विवाद दर्ज करें",
  "Resolve Ticket": "शिकायत हल करें",
  "Save Resolution": "समाधान सहेजें",
  "Close": "बंद करें",
  "Confirm": "पुष्टि करें",
  "Uploading...": "अपलोड हो रहा है...",
  "Saving...": "सहेजा जा रहा है...",

  // Contract Lifecycle Statuses
  "All": "सभी",
  "Pending": "लंबित",
  "Accepted": "स्वीकृत",
  "In Progress": "प्रगति पर है",
  "Ready for Delivery": "डिलीवरी के लिए तैयार",
  "Dispatched": "प्रेषित",
  "Delivered": "डिलीवर किया गया",
  "Completed": "पूर्ण",
  "Cancelled": "रद्द किया गया",

  // Payment Statuses
  "Paid": "भुगतान किया गया",
  "Initiated": "प्रारंभ किया गया",
  "Unpaid": "अदत्त",
  "Failed": "विफल",
  "Refunded": "वापस किया गया",
  "Captured": "प्राप्त किया गया",
  "Created": "बनाया गया",

  // Verification & KYC Statuses
  "Verified": "सत्यापित",
  "Pending Verification": "सत्यापन लंबित",
  "Unverified": "असत्यापित",
  "Aadhaar Verified": "आधार सत्यापित",
  "Aadhaar Identity Unverified": "आधार पहचान असत्यापित",
  "Aadhaar e-KYC Identity Verification": "आधार ई-केवाईसी पहचान सत्यापन",
  "Aadhaar Identity Verification": "आधार पहचान सत्यापन",
  "UIDAI Compliant Paperless e-KYC": "यूआईडीएआई अनुपालन पेपरलेस ई-केवाईसी",
  "Sandbox Mode": "सैंडबॉक्स मोड",
  "Authorized Provider Active": "अधिकृत प्रदाता सक्रिय",

  // Dispute Statuses
  "Open": "खुला",
  "Under Review": "समीक्षाधीन",
  "Resolved": "हल किया गया",

  // Section Tabs
  "My Contracts": "मेरे अनुबंध",
  "My Assigned Contracts": "मेरे सौंपे गए अनुबंध",
  "Received Payments": "प्राप्त भुगतान",
  "Payment Gateway History": "भुगतान गेटवे इतिहास",
  "Payments Audit": "भुगतान ऑडिट",
  "System Analytics": "सिस्टम एनालिटिक्स",
  "User Management": "उपयोगकर्ता प्रबंधन",
  "Verification Queue": "सत्यापन कतार",
  "All Contracts": "सभी अनुबंध",
  "Dispute Governance": "विवाद शासन",

  // Dashboard Stats
  "Pending Proposals": "लंबित प्रस्ताव",
  "Active Contracts": "सक्रिय अनुबंध",
  "Completed Contracts": "पूर्ण अनुबंध",
  "Confirmed Revenue": "पुष्ट राजस्व",
  "Pending Payments": "लंबित भुगतान",
  "Total Expenditure": "कुल व्यय",
  "Pending Payables": "लंबित देय राशि",
  "Total Registered Users": "कुल पंजीकृत उपयोगकर्ता",
  "Total Platform Volume": "कुल प्लेटफ़ॉर्म मात्रा",
  "Active Disputes": "सक्रिय विवाद",

  // Form Fields & Labels
  "Full Name": "पूरा नाम",
  "Email Address": "ईमेल पता",
  "Phone Number": "फ़ोन नंबर",
  "Password": "पासवर्ड",
  "Role": "भूमिका",
  "Address / Location": "पता / स्थान",
  "District, State": "ज़िला, राज्य",
  "Crop Name": "फ़सल का नाम",
  "Quantity": "मात्रा",
  "Quantity (Quintals / Tons)": "मात्रा (क्विंटल / टन)",
  "Agreed Price": "सहमत मूल्य",
  "Expected Price": "अपेक्षित मूल्य",
  "Total Amount": "कुल राशि",
  "Delivery Date": "डिलीवरी तिथि",
  "Delivery Location": "डिलीवरी स्थान",
  "Payment Terms": "भुगतान शर्तें",
  "Advance Payment": "अग्रिम भुगतान",
  "Farm Details": "खेत का विवरण",
  "Farm Size": "खेत का आकार",
  "Farm Size (Acres / Hectares)": "खेत का आकार (एकड़ / हेक्टेयर)",
  "Soil Type": "मिट्टी का प्रकार",
  "Crops Grown": "उगाई जाने वाली फ़सलें",
  "Crops Grown (Comma separated)": "उगाई जाने वाली फ़सलें (अल्पविराम से अलग)",
  "Business / Company Name": "व्यवसाय / कंपनी का नाम",
  "Business Name": "व्यवसाय का नाम",
  "Farm Photos Evidence": "खेत की फ़ोटो प्रमाण",
  "Business Details": "व्यवसाय विवरण",
  "Personal & Contact Details": "व्यक्तिगत और संपर्क विवरण",
  "12-Digit Aadhaar Number": "12-अंकीय आधार संख्या",
  "Enter 12-digit Aadhaar number": "12-अंकीय आधार संख्या दर्ज करें",
  "Enter 6-Digit OTP Code": "6-अंकीय ओटीपी कोड दर्ज करें",
  "Enter 6-digit OTP": "6-अंकीय ओटीपी दर्ज करें",
  "Enter OTP (Sandbox: 123456)": "ओटीपी दर्ज करें (सैंडबॉक्स: 123456)",
  "Aadhaar Number": "आधार संख्या",
  "Description": "विवरण",
  "Title": "शीर्षक",
  "Status": "स्थिति",
  "Date": "तिथि",
  "Amount": "राशि",
  "Method": "तरीका",
  "Order ID": "ऑर्डर आईडी",
  "Payment ID": "भुगतान आईडी",
  "Receipt": "रसीद",
  "Action": "कार्रवाई",
  "Actions": "कार्रवाइयां",
  "Resolution Details": "समाधान विवरण",

  // Empty States & Messages
  "No contracts found": "कोई अनुबंध नहीं मिला",
  "No contracts match the selected filter criteria.": "चयनित फ़िल्टर मानदंडों से कोई अनुबंध मेल नहीं खाता।",
  "No payments recorded yet": "अभी तक कोई भुगतान दर्ज नहीं किया गया है",
  "No transaction history found for this account.": "इस खाते के लिए कोई लेनदेन इतिहास नहीं मिला।",
  "Search contracts by crop, ID, location, or buyer...": "फ़सल, आईडी, स्थान या खरीदार द्वारा अनुबंध खोजें...",
  "Search contracts by crop, ID, location, or farmer...": "फ़सल, आईडी, स्थान या किसान द्वारा अनुबंध खोजें...",
  "Search by Order ID, Payment ID, or Contract...": "ऑर्डर आईडी, भुगतान आईडी या अनुबंध द्वारा खोजें...",

  // Razorpay & Payments
  "Razorpay Secure Checkout": "रेज़रपे सुरक्षित चेकआउट",
  "Razorpay Standard Checkout": "रेज़रपे मानक चेकआउट",
  "Pay with UPI, Cards, Netbanking": "यूपीआई, कार्ड, नेटबैंकिंग से भुगतान करें",
  "Instant bank confirmation and official payment receipt": "तत्काल बैंक पुष्टि और आधिकारिक भुगतान रसीद",
  "Contract Payment": "अनुबंध भुगतान",
  "Payment Details": "भुगतान विवरण",
  "Payment Successful!": "भुगतान सफल!",
  "Payment Verification Failed": "भुगतान सत्यापन विफल",
  "Simulated Gateway Checkout (Development Mode)": "सिम्युलेटेड गेटवे चेकआउट (विकास मोड)",
  "Simulate Successful Payment": "सफल भुगतान का अनुकरण करें",
  "Cancel Transaction": "लेनदेन रद्द करें",

  // Data Minimization & Consent
  "Data Minimization: Full Aadhaar is never saved in our database. Only a secure one-way hash and last 4 digits are retained.": "डेटा न्यूनीकरण: पूरा आधार हमारे डेटाबेस में कभी संग्रहीत नहीं होता है। केवल सुरक्षित वन-वे हैश और अंतिम 4 अंक ही रखे जाते हैं।",
  "I hereby give voluntary consent to authenticate my identity via Aadhaar OTP with an authorized verification provider for KYC identity verification under Contract Farming rules.": "मैं अनुबंध खेती नियमों के तहत केवाईसी पहचान सत्यापन के लिए एक अधिकृत सत्यापन प्रदाता के साथ आधार ओटीपी के माध्यम से अपनी पहचान प्रमाणित करने के लिए स्वेच्छा से सहमति देता हूं।",
  "I voluntarily submit my Aadhaar and consent to OTP authentication for identity KYC. My 12-digit Aadhaar number will never be saved in plaintext.": "मैं स्वेच्छा से अपना आधार जमा करता हूं और पहचान केवाईसी के लिए ओटीपी प्रमाणीकरण के लिए सहमति देता हूं। मेरी 12-अंकीय आधार संख्या कभी भी प्लेनटेक्स्ट में सहेजी नहीं जाएगी।",

  // Marketplace
  "Direct Producer Marketplace": "प्रत्यक्ष उत्पादक बाज़ार",
  "Agricultural Produce Marketplace": "कृषि उपज बाज़ार",
  "Browse verified farmer crops, view crop stages and farm photos, and request direct contract farming agreements.": "सत्यापित किसान फसलों को ब्राउज़ करें, फसल के चरण और खेत की तस्वीरें देखें, और सीधे अनुबंध खेती समझौतों का अनुरोध करें।",
  "+ Create Direct Request": "+ प्रत्यक्ष अनुरोध बनाएं",
  "Search produce by crop name, farmer name, location...": "फसल के नाम, किसान के नाम, स्थान द्वारा उपज खोजें...",
  "All Categories": "सभी श्रेणियां",
  "Grains & Cereals": "अनाज और दलहन",
  "Vegetables": "सब्जियां",
  "Fruits": "फल",
  "Pulses & Legumes": "दालें और फलियां",
  "Spices": "मसाले",
  "Oilseeds": "तिलहन",
  "Organic Produce": "जैविक उत्पाद",
  "Expected Harvest": "अपेक्षित कटाई",
  "Expected Quantity": "अपेक्षित मात्रा",
  "Available for Contract": "अनुबंध के लिए उपलब्ध",
  "Verified Farmer": "सत्यापित किसान",
  "Clear Search Filters": "खोज फ़िल्टर साफ़ करें",
  "No produce listings match your search": "आपकी खोज से कोई उपज सूची मेल नहीं खाती",
  "Try broadening your category filter or search keywords.": "अपनी श्रेणी फ़िल्टर या खोज कीवर्ड को विस्तृत करने का प्रयास करें।",
  "Request Contract": "अनुबंध का अनुरोध करें",
  "Browse Marketplace": "बाज़ार ब्राउज़ करें",

  // Progress Center
  "Production Tracking Center": "उत्पादन ट्रैकिंग केंद्र",
  "Farm Production & Crop Progress": "कृषि उत्पादन और फसल प्रगति",
  "Real-time crop stage updates, land cultivation logs, and photo evidence recorded by contracted farmers.": "अनुबंधित किसानों द्वारा दर्ज वास्तविक समय की फसल चरण अपडेट, भूमि खेती लॉग और फोटो साक्ष्य।",
  "Log Progress Note": "प्रगति नोट दर्ज करें",
  "Active Contract Farms": "सक्रिय अनुबंध खेत",
  "No active farm progress tracking": "कोई सक्रिय कृषि प्रगति ट्रैकिंग नहीं",
  "Accepted or active contracts will automatically appear here for real-time progress logging.": "स्वीकृत या सक्रिय अनुबंध वास्तविक समय की प्रगति दर्ज करने के लिए स्वतः यहां दिखाई देंगे।",
  "Add Progress Update": "प्रगति अपडेट जोड़ें",
  "Progress Note": "प्रगति नोट",
  "Progress Photo Evidence (Optional)": "प्रगति फोटो साक्ष्य (वैकल्पिक)",
  "Save Progress": "प्रगति सहेजें",
  "Seeds germinated, applied organic fertilizer": "बीज अंकुरित हुए, जैविक उर्वरक डाला गया",

  // Dispute Center
  "Conflict Governance": "विवाद शासन",
  "Dispute Resolution Center": "विवाद समाधान केंद्र",
  "Submit contract disputes, view official investigation status, and track admin resolutions.": "अनुबंध विवाद प्रस्तुत करें, आधिकारिक जांच स्थिति देखें और व्यवस्थापक समाधान ट्रैक करें।",
  "+ Raise New Dispute": "+ नया विवाद दर्ज करें",
  "No dispute tickets filed": "कोई विवाद टिकट दर्ज नहीं किया गया",
  "There are currently no open or historical contract dispute tickets.": "वर्तमान में कोई खुला या ऐतिहासिक अनुबंध विवाद टिकट नहीं है।",
  "Dispute Title": "विवाद शीर्षक",
  "Provide complete details about the issue...": "मुद्दे के बारे में पूरी जानकारी प्रदान करें...",
  "Submit Dispute": "विवाद जमा करें",
  "Quality disagreement or delivery delay": "गुणवत्ता असहमति या वितरण में देरी",

  // Insights & Analytics
  "Real Data Analytics": "वास्तविक डेटा एनालिटिक्स",
  "Smart Insights & Network Analytics": "स्मार्ट अंतर्दृष्टि और नेटवर्क एनालिटिक्स",
  "Calculated metrics, contract status distributions, and financial analytics derived strictly from real database records.": "वास्तविक डेटाबेस रिकॉर्ड से कड़ाई से प्राप्त परिकलित मेट्रिक्स, अनुबंध स्थिति वितरण और वित्तीय एनालिटिक्स।",
  "Active system agreements": "सक्रिय प्रणाली समझौते",
  "Contract Lifecycle Status Distribution": "अनुबंध जीवनचक्र स्थिति वितरण",
  "Payment Settlement Statuses": "भुगतान निपटान स्थितियां",
  "Total Agreed Value": "कुल सहमत मूल्य",
  "Settled Payouts": "निपटाये गए भुगतान",
  "Pending Payouts": "लंबित भुगतान",
  "Total Contracts": "कुल अनुबंध",
  "Settled Payments": "निपटाये गए भुगतान",

  // Activity Center
  "Audit Trail": "ऑडिट ट्रेल",
  "System Activity & Audit Log": "सिस्टम गतिविधि और ऑडिट लॉग",
  "Chronological audit log of contract state transitions, dispute events, and verification actions.": "अनुबंध स्थिति संक्रमण, विवाद घटनाओं और सत्यापन कार्रवाइयों का कालानुक्रमिक ऑडिट लॉग।",
  "No activity logs recorded yet": "अभी तक कोई गतिविधि लॉग दर्ज नहीं किया गया है",
  "System activity will populate here as contracts and status updates are performed.": "अनुबंध और स्थिति अपडेट निष्पादित होने पर सिस्टम गतिविधि यहां प्रदर्शित होगी।",
  "New Contract Created": "नया अनुबंध बनाया गया",
  "Contract Status Updated to": "अनुबंध स्थिति को अपडेट किया गया",
  "Dispute Filed": "विवाद दर्ज किया गया",

  // Modals & Navigation
  "Create New Contract": "नया अनुबंध बनाएं",
  "Select Farmer (Required)": "किसान चुनें (आवश्यक)",
  "Select an active farmer to assign this contract directly in": "इस अनुबंध को सीधे सौंपने के लिए एक सक्रिय किसान चुनें",
  "Type to filter farmers...": "किसानों को फ़िल्टर करने के लिए टाइप करें...",
  "Search Farmers (Name, Location, Crop)": "किसान खोजें (नाम, स्थान, फसल)",
  "Expected delivery date": "अपेक्षित डिलीवरी तिथि",
  "Price per unit (₹)": "प्रति इकाई मूल्य (₹)",
  "Price per unit": "प्रति इकाई मूल्य",
  "Crop name": "फसल का नाम",
  "Unit": "इकाई",
  "Location": "स्थान",
  "Additional requirements (optional)": "अतिरिक्त आवश्यकताएं (वैकल्पिक)",
  "Farmer Profile & Farm Information": "किसान प्रोफ़ाइल और कृषि जानकारी",
  "View Full Profile & Photos": "पूर्ण प्रोफ़ाइल और तस्वीरें देखें",
  "Close & Proceed with Selection": "बंद करें और चयन के साथ आगे बढ़ें",
  "Crop Commodity:": "फसल वस्तु:",
  "Contract Volume:": "अनुबंध मात्रा:",
  "Total Contract Value:": "कुल अनुबंध मूल्य:",
  "Aadhaar Status:": "आधार स्थिति:",
  "Notification Center": "अधिसूचना केंद्र",
  "Mark all read": "सभी को पढ़ा हुआ चिह्नित करें",
  "Mark read": "पढ़ा हुआ चिह्नित करें",
  "No notifications available.": "कोई सूचना उपलब्ध नहीं है।",
  "Loading notifications...": "सूचनाएं लोड हो रही हैं...",
  "User Profile & Verification": "उपयोगकर्ता प्रोफ़ाइल और सत्यापन",
  "User Profile Profile & Verification": "उपयोगकर्ता प्रोफ़ाइल और सत्यापन",
  "Inspect Profile": "प्रोफ़ाइल का निरीक्षण करें",
  "Confirm User Deletion": "उपयोगकर्ता विलोपन की पुष्टि करें",
  "Are you sure you want to delete user": "क्या आप वाकई उपयोगकर्ता को हटाना चाहते हैं",
  "This action cannot be undone.": "यह क्रिया पूर्ववत नहीं की जा सकती।",
  "Yes, Delete User": "हाँ, उपयोगकर्ता हटाएं",
  "Resolve Dispute": "विवाद हल करें",
  "Enter resolution notes...": "समाधान नोट दर्ज करें...",
  "Enterprise Contract Farming Management Platform": "एंटरप्राइज अनुबंध खेती प्रबंधन मंच",
  "Secure role-based governance for farmers, buyers, and administrators. Track crop production, digital contracts, and payouts.": "किसानों, खरीदारों और व्यवस्थापकों के लिए सुरक्षित भूमिका-आधारित शासन। फसल उत्पादन, डिजिटल अनुबंध और भुगतान ट्रैक करें।",
  "End-to-end encrypted JWT auth & Aadhaar identity verification.": "एंड-टू-एंड एन्क्रिप्टेड जेडब्ल्यूटी प्रमाणीकरण और आधार पहचान सत्यापन।",
  "Account Login": "खाता लॉगिन",
  "Sign in using your registered Email, Phone, or Aadhaar number.": "अपने पंजीकृत ईमेल, फोन या आधार संख्या का उपयोग करके साइन इन करें।",
  "Email / Phone / 12-Digit Aadhaar": "ईमेल / फोन / 12-अंकीय आधार",
  "Sign In to Dashboard": "डैशबोर्ड में साइन इन करें",
  "Don't have an account?": "खाता नहीं है?",
  "Register as Farmer / Buyer": "किसान / खरीदार के रूप में पंजीकरण करें",
  "Already registered?": "पहले से पंजीकृत हैं?",
  "Sign In": "साइन इन करें",
  "Complete Registration": "पंजीकरण पूरा करें",
  "Digitized Contract Farming Management & Market Hub": "डिजिटल अनुबंध खेती प्रबंधन और बाज़ार हब",
  "Empowering producers and commercial buyers with automated contract lifecycles, Aadhaar identity verification, real-time crop progress tracking, and secure financial settlements.": "स्वचालित अनुबंध जीवनचक्र, आधार पहचान सत्यापन, वास्तविक समय फसल प्रगति ट्रैकिंग और सुरक्षित वित्तीय निपटान के साथ उत्पादकों और वाणिज्यिक खरीदारों को सशक्त बनाना।",
  "Go to My Dashboard": "मेरे डैशबोर्ड पर जाएं",
  "Get Started Free": "मुफ़्त शुरू करें",
  "Active Contract Preview": "सक्रिय अनुबंध पूर्वावलोकन",
  "Next-Gen Contract Farming SaaS": "नेक्स्ट-जेन अनुबंध खेती सास",
  "Farm Marketplace": "कृषि बाज़ार",
  "Farm Progress Center": "कृषि प्रगति केंद्र",
  "Smart Data Insights": "स्मार्ट डेटा अंतर्दृष्टि",
  "Dispatched Shipments": "प्रेषित लदान",
  "Payment Gateway Transactions & Orders": "भुगतान गेटवे लेनदेन और ऑर्डर",
  "Cryptographically verified Razorpay transactions with audit reference": "ऑडिट संदर्भ के साथ क्रिप्टोग्राफिक रूप से सत्यापित रेज़रपे लेनदेन",
  "Complete business verification to get verified status badge.": "सत्यापित स्थिति बैज प्राप्त करने के लिए व्यावसायिक सत्यापन पूरा करें।",
  "Verify Business": "व्यवसाय सत्यापित करें",
  "Profile Verification Pending:": "प्रोफ़ाइल सत्यापन लंबित:",
  "Profile Verification Pending": "प्रोफ़ाइल सत्यापन लंबित",
  "Complete your profile & Aadhaar OTP verification to increase buyer trust.": "खरीदार का विश्वास बढ़ाने के लिए अपनी प्रोफ़ाइल और आधार ओटीपी सत्यापन पूरा करें।",
  "🌾 Farm Details": "🌾 कृषि विवरण",
  "🏢 Business Details": "🏢 व्यवसाय विवरण",
  "🌾 Crops Grown & Farm Photos": "🌾 उगाई जाने वाली फसलें और खेत की तस्वीरें",
  "Crops:": "फसलें:",
  "Crops": "फसलें",
  "Farm Photos:": "खेत की तस्वीरें:",
  "No farm photos uploaded by this farmer.": "इस किसान द्वारा कोई खेत की तस्वीर अपलोड नहीं की गई है।",
  "Type keyword to search across the entire contract farming network...": "संपूर्ण अनुबंध खेती नेटवर्क में खोजने के लिए कीवर्ड टाइप करें...",
  "Farmers & Profiles": "किसान और प्रोफ़ाइल",
  "Registered Farmers & Buyers": "पंजीकृत किसान और खरीदार",
  "User Details": "उपयोगकर्ता विवरण",
  "Contact Info": "संपर्क जानकारी",
  "Aadhaar Status": "आधार स्थिति",
  "Account Status": "खाता स्थिति",
  "User Verification Queue": "उपयोगकर्ता सत्यापन कतार",
  "Verification Evidence": "सत्यापन साक्ष्य",
  "Deactivate": "निष्क्रिय करें",
  "Activate": "सक्रिय करें",
  "✓ Verify": "✓ सत्यापित करें",
  "✕ Reject": "✕ अस्वीकार करें",
  "Farmer Profile": "किसान प्रोफ़ाइल",
  "Buyer Profile": "खरीदार प्रोफ़ाइल",
  "Admin Profile": "व्यवस्थापक प्रोफ़ाइल",
  "Resend OTP in": "ओटीपी पुनः भेजें",
  "Aadhaar Identity Verified": "आधार पहचान सत्यापित",
  "Address / District": "पता / ज़िला",
  "Creating Account...": "खाता बनाया जा रहा है...",
  "Authenticating...": "प्रमाणीकरण हो रहा है...",
  "Upload Photo": "फोटो अपलोड करें",
  "+ Upload Photo": "+ फोटो अपलोड करें",
  "Crop Commodity": "फसल वस्तु",
  "Contract Volume": "अनुबंध मात्रा",
  "Verified Producer": "सत्यापित उत्पादक",
  "Select Farmer": "किसान चुनें",
  "Selected Farmer": "चयनित किसान",
  "Total amount": "कुल राशि",
  "Create contract": "अनुबंध बनाएं",
  "Creating...": "बनाया जा रहा है...",
  "No data found": "कोई डेटा नहीं मिला",
  "There are no records matching your request at this time.": "इस समय आपके अनुरोध से मेल खाने वाला कोई रिकॉर्ड नहीं है।",
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("app_language") || "en";
  });

  const [availableVoices, setAvailableVoices] = useState([]);

  // Load voices for Web Speech API
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices || []);
      }
    };

    updateVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  }, []);

  // Translation helper: looks up phrase or word
  const t = useCallback((text, targetLang) => {
    if (!text || typeof text !== "string") return text;
    const currentLang = targetLang || language;
    if (currentLang === "en") return text;

    // Check exact match
    const trimmed = text.trim();
    if (translations[trimmed]) {
      // Preserve leading/trailing spaces
      const leadingSpace = text.match(/^\s*/)[0];
      const trailingSpace = text.match(/\s*$/)[0];
      return `${leadingSpace}${translations[trimmed]}${trailingSpace}`;
    }

    // Check case-insensitive match
    const lower = trimmed.toLowerCase();
    const foundKey = Object.keys(translations).find(
      (k) => k.toLowerCase() === lower
    );
    if (foundKey) {
      return translations[foundKey];
    }

    return text;
  }, [language]);

  // Pronounce ONLY the specific single word in the selected language
  const speak = useCallback((word, customLang) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("Web Speech API is not supported in this browser.");
      return;
    }

    const currentLang = customLang || language;

    // Stop any previously playing speech immediately to avoid overlap
    window.speechSynthesis.cancel();

    if (!word) return;

    // Strip out common surrounding punctuation (quotes, brackets, commas, periods)
    // while keeping letters, digits, and Indian language unicode characters
    const cleanWord = String(word).replace(/[.,/#!$%^&*;:{}=\-_`~()?"'<>।॥]/gu, "").trim();
    if (!cleanWord) return;

    const utterance = new SpeechSynthesisUtterance(cleanWord);
    utterance.lang = currentLang === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 0.88; // clear and intelligible speed
    utterance.pitch = 1.0;

    // Pick appropriate voice if available
    const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
    if (currentLang === "hi") {
      const hindiVoice = voices.find(
        (v) => v.lang === "hi-IN" || v.lang.startsWith("hi") || v.name.toLowerCase().includes("hindi")
      );
      if (hindiVoice) utterance.voice = hindiVoice;
    } else {
      const englishVoice = voices.find(
        (v) => v.lang === "en-US" || v.lang === "en-IN" || v.lang.startsWith("en")
      );
      if (englishVoice) utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [language, availableVoices]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, speak }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "en",
      setLanguage: () => {},
      t: (text) => text,
      speak: () => {},
    };
  }
  return context;
};

export default LanguageContext;
