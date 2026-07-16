// ═══════════════════════════════════════════════════════════════
// COURSE_LINKS — כל קישורי הפרויקט במקום אחד. ערוך כאן בלבד.
//   type:"doc"  = Google Doc  → צריך id
//   type:"file" = קובץ Drive (PDF) → צריך id
//   type:"url"  = קישור חיצוני (הקלטה וכו') → צריך url מלא
// להחלפת קישור: עדכן את ה-id / url. index.html נטען מכאן אוטומטית.
// ═══════════════════════════════════════════════════════════════
const COURSE_LINKS = {
  "periop": {
    textbook: { id:"1jQuFxSCHLs1idlK9_G9m6kYDvA70wFXD", label:"📖 ברונר 14-16", type:"file" },
    summary:  { id:"1_Q3oTcZQVyaD6Ed1CRy4LPj3adhIi5uZWmzEw_WF5g0", label:"📝 סיכום ברונר 14-16", type:"doc" },
    lectures: [
      { id:"1_D6MfPcc9IUYTbL7TZiAiIUtRuz3wT7i", label:"📄 סביב ניתוחי", type:"file" },
      { id:"1ODJQF_1K_k-2YKNATSZzsBtIZ0m5ZHXs", label:"📄 הרדמה", type:"file" },
      { id:"1VO_TaGpDRs4ydUNW8hDc1zEB7CaTk1K0", label:"📄 סיבוכי הרדמה", type:"file" },
      { id:"1IPkmqt6Mjy_5QCpaIJh3ZUk22uzopjhI", label:"📄 Post-op כאב", type:"file" },
      { id:"1btpGQB9tCRA7zpHwx4ZX_9eR5pxcXx_0", label:"📄 קטטר שתן", type:"file" },
    ],
  },
  "shock": {
    textbook: { id:"1xhqT0hKshLExY45xNgGjyOtGXc22t6sf", label:"📖 ברונר פרק 11", type:"file" },
    summary:  { id:"1TAxSP7QJyjuNO_4MDy4Yezw3Lg4Uo_ERAwTm5b3_aBA", label:"📝 סיכום ברונר 11", type:"doc" },
    lectures: [
      { id:"1z6_OIQyHSfQHTK45VMwd6jDaR3WcbZMw", label:"📄 הלם", type:"file" },
    ],
  },
  "respiratory": {
    textbook: { id:"1WgdNCIlxRD8pX11BFZhLOGA4_i6_UAOL", label:"📖 ברונר 17-20", type:"file" },
    summary:  { id:"1yjC1we-57H_fAhFHOJWIhhCqMuExNbGa1Aj6NacnNpQ", label:"📝 סיכום ברונר 17-20", type:"doc" },
    lectures: [
      { id:"1ju0Xfs_D3nZF23GaVeyso68fIHIh-oI-", label:"📄 מבוא נשימה", type:"file" },
      { id:"17NiBUnJtkt501KNSL9yiTFL-5JJOXitZ", label:"📄 חומצי-בסיסי", type:"file" },
      { id:"1IAM15GXVVCyByPOCeq2CRtZSZccE_IjZ", label:"📄 Asthma", type:"file" },
      { id:"1WvUOBEDQaEASIYZ1Bsvp6eqqpYi9BjWh", label:"📄 COPD", type:"file" },
      { id:"1CE8PXnB_V5UnPKyBxkMGjPwrHTPJmjCb", label:"📄 Pneumonia & TB", type:"file" },
      { id:"1kuxMNbMIqXqesr7WxDHEdYHKLiLFGbql", label:"📄 ARDS", type:"file" },
      { id:"13berZGzuK9eNR66Tz18As8reqhjj3Ufa", label:"📄 PE", type:"file" },
      { id:"1XtGigEzEIBhuNZXr8dHPs1WOEhKYpsm7", label:"📄 Oxygen & NIV", type:"file" },
      { id:"1kasniRm75oBs06BTMN7wh-LcuOq0keXr", label:"📄 Mechanical Vent.", type:"file" },
    ],
  },
  "cardio": {
    textbook: { id:"1rTR6MRb9R3czSEww3Y-o6NfoSbFEZ2nk", label:"📖 ברונר 21-25", type:"file" },
    summary:  { id:"1Hs_8q5nWWRaYOleqKMq9OLFkUS-0WBjQqgEFX1NdmVE", label:"📝 סיכום ברונר 21-25", type:"doc" },
    lectures: [
      { id:"1dSqhVqflVDDnXphP0_-bQSh5NdXglk2Z", label:"📄 מבוא", type:"file" },
      { id:"1IlQ0qm-7YTeh38PRQjSHUbdDMEQZQAA5", label:"📄 אבחון קרדיו", type:"file" },
      { id:"1zDZNYTlv9wo6gzhOhVkQw-gvBWdISd7r", label:"📄 ECG (1)", type:"file" },
      { id:"15MyGhfP80yWFOSGkGiE1CBbiSMDWI7kq", label:"📄 ECG (2)", type:"file" },
      { id:"1eF_udpOYdh2HvdY3SLngJ4drNWnteX7L", label:"📄 ECG טיפול", type:"file" },
      { id:"145Z-LMOR8omsrjjHqCWQazU-BNyZLRJn", label:"📄 קוצבי לב", type:"file" },
      { id:"1VCaiLtQcrgU196JxsrAXDbLukN6aKwSL", label:"📄 כליליות", type:"file" },
      { id:"1ZBA05heUSFkg2MjV5pYfwVv3Etgo7Y1X", label:"📄 מסתמיות", type:"file" },
      { id:"13MNdVknL1MDb-B93qFi_X9zyni4IWbu2", label:"📄 HF", type:"file" },
      { id:"1vLJph8LIbC3adPLpcM2gIBTFs1CwIUt4", label:"📄 דלקתיות", type:"file" },
      { id:"1XEZls_aqJyIdHL_0RnUhG-95TyIFRxFh", label:"📄 CABG", type:"file" },
      { id:"1WYO9kU9hxn6Or-pURT1WlWCiEmvNqin1", label:"📄 HTN", type:"file" },
      { id:"1R_aUQGdoaOaur4ZzGuQF-FSMmsLyV-xj", label:"📄 קרדיומיופטיה", type:"file" },
    ],
  },
  "vascular": {
    textbook: { id:"1c0upj-F9OxXaZ6IN8Ee5cnX6evQOTLTK", label:"📖 ברונר 26-27", type:"file" },
    summary:  { id:"1f89J9kyP7l1RPblSJJ_YNqnXPSJfv5zQ1XvmjpFtSLs", label:"📝 סיכום ברונר 26-27", type:"doc" },
    lectures: [
      { id:"1j3x3ZeslaPwy0y1L8D-wMONG-w00w_Tn", label:"📄 אבחון כלי דם", type:"file" },
      { id:"1MSfoQ8BeES1ZI4dhUC5cVr9p5uWGXZF0", label:"📄 Arterial", type:"file" },
      { id:"12A78lGaVC8f5oqolmzdLzBLyBx9ZuPPL", label:"📄 Venous", type:"file" },
      { id:"1N1VS8AWdL5vl5PgyG55VBQHKUZ0Fc5Xl", label:"📄 Lymphatic", type:"file" },
    ],
  },
  "gastro": {
    textbook: { id:"1RdkxUVOay46Vq72ei_9nxuFJF4uqPV0Y", label:"📖 ברונר 38-44", type:"file" },
    summary:  { id:"1L5EH1JA8DI7ix8kQS_t9rVwVvH7R4dQw6kBRSGaDr2w", label:"📝 סיכום ברונר 38-44", type:"doc" },
    lectures: [
      { id:"1oWpvdAUIHRZ5kEzzHsWTQqAhSTnWYr7B", label:"📄 מבוא", type:"file" },
      { id:"1doLgdRwKO7cuzuL1qVNc4BiEs36vbtw6", label:"📄 ושט", type:"file" },
      { id:"1mHoOJ6hs-ZZuypVu6MS6XrD2b61T3zRi", label:"📄 קיבה", type:"file" },
      { id:"1Ve4VJ66yvPgxR_-xhdg3W4rfBCWoIwXS", label:"📄 Obesity", type:"file" },
      { id:"1ieiqAfySkorSuEnB3ZfQnxJq5ChiWi0s", label:"📄 Hepatitis", type:"file" },
      { id:"1V63TPbCwNxUMbIU_X610wL9wCeLvn3v3", label:"📄 Cirrhosis", type:"file" },
      { id:"1BPp9IAh9sPCN4PzB6tLBTIz9H9eopfZ5", label:"📄 כיס מרה", type:"file" },
      { id:"1sEYQqwFaMkVr8f0_ndLAHTvHdg2vgsG-", label:"📄 לבלב", type:"file" },
      { id:"1w0n_LkBI2suXbdlOITskjk3Lqbrx9_h0", label:"📄 מעיים", type:"file" },
      { id:"15ygzkVK-tx8Q0DCgehh6E1yDcFaZsxte", label:"📄 IBD & IBS", type:"file" },
      { id:"1Wmijg_EmNzEn0_-dTHm4a5Yj_tsaUwtg", label:"📄 CRC ברונר", type:"file" },
      { id:"1htj6N8djtdJIt3Q6fN1ewDRjesoONl-p", label:"📄 CRC+Polyps", type:"file" },
      { id:"1N9p7o2J0m3QjJMkaZxBP2z6CvcstZqko", label:"📄 Anorectum", type:"file" },
      { id:"1_gqhuO_8h85y9cr-e0YGF8Hu8xF6UvV1", label:"📄 בקעים", type:"file" },
      { id:"1dixkinGm9MGSjsS785epTo3T4s7wwB2E", label:"📄 סטומה-טיפול", type:"file" },
      { id:"1a94c-qiwY_WM4VVQjaDCPQD_gRGk7cVo", label:"📄 סטומה-סיבוכים", type:"file" },
    ],
  },
  "endocrine": {
    textbook: { id:"1j5LppkkiqG1tsbdbPeR7oST9WtaoiKxO", label:"📖 ברונר 45-46", type:"file" },
    summary:  { id:"1Cbi5wLfHYndlO0tzSMICh4fN7lMnapieZ2xmff8iZTI", label:"📝 סיכום ברונר 45-46", type:"doc" },
    lectures: [
      { id:"14rnpvkVX_ePDmvgX0MqArhpE9ytUK1PX", label:"📄 היפופיזה", type:"file" },
      { id:"1BTHrRYxHffgY7BXdHRpvkT0-kvFEwQsF", label:"📄 יותרת הכליה", type:"file" },
      { id:"1kWZRcV7InD6UmbfRA0EBgLT-SDl3fXfZ", label:"📄 תריס", type:"file" },
      { id:"1faLioGvdrW2ZCZNwIqHyaAEzi2Fg3Wpq", label:"📄 יותרת התריס", type:"file" },
      { id:"11T1PYY1fnS5CSQBy-4Holx881gnFfERc", label:"📄 סוכרת", type:"file" },
    ],
  },
  "nephrology": {
    textbook: { id:"1xOXQ8bVjxyyPfhckylY9LIJC0Vbf9Kww", label:"📖 ברונר 47-48", type:"file" },
    lectures: [
      { id:"1m54mVih8ggqaAiy60kfW1Viwanz_dH-B", label:"📄 מבוא ואנטומיה", type:"file" },
      { id:"1AvxoUzgh1RMzohbydBM4UY_kYqxKAH2K", label:"📄 פגיעה כליתית אקוטית (AKI)", type:"file" },
      { id:"1Mq3ifGnGVZxLXNRVrUodI1n800gFQ34x", label:"📄 אי ספיקת כליות כרונית (CKD)", type:"file" },
      { id:"1BX_PTwR3JNf9lnohp2N16G7VbBqtm0d_", label:"📄 דיאליזה פריטוניאלית", type:"file" },
    ],
  },
  "urology": {
    textbook: { id:"1ogBkPoAvUP-FC9ATQt_5-tS750rDZgB1", label:"📖 ברונר 47-49", type:"file" },
    summary:  { id:"11No_mmAxkB-_3KfFeAfQxLH8c3svsXfT79E3xfw1or0", label:"📝 סיכום ברונר 47-49", type:"doc" },
    lectures: [
      { id:"1K9OVkaHV-yTuHzO6yDf8zsvxmCYiYz0j", label:"📄 אנטומיה ובדיקות הדמייה", type:"file" },
      { id:"1_yqoqfDrDUTe90tIbDr0Bt5cznBfkSnD", label:"📄 Urology", type:"file" },
      { id:"1enfmOCL0bMQDaaKB7ivxxdFpRThQ4yXp", label:"📄 Urinary Incontinence", type:"file" },
      { id:"1N31D_4Vk1XDE03si-_FvfrPrzfAo5ufy", label:"📄 סרטן שלפוחית", type:"file" },
      { id:"1UtQFG8FxNjWVpvVxSR7I40-yuIi35Zq5", label:"📄 Renal Cancer", type:"file" },
      { id:"1w5fu60kYhLdaqpcfMxVLzW84J7L0EDU1", label:"📄 פרוסטטה", type:"file" },
      { id:"1cQkuoMt2mUYzq_NI7WdK_gq4rhgy-DSs", label:"📄 UTI", type:"file" },
      { id:"13mruwJzXnsQgOdlpFLx_VF53v-ugdGQm", label:"📄 אבנים בדרכי השתן", type:"file" },
      { id:"1jHOk8-zCprrpVhmuxQ1ognZHyKvLUTB9", label:"📄 האשך", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=55216", label:"🎬 הקלטה 24.5", type:"url" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=55958", label:"🎬 הקלטה 14.6", type:"url" },
    ],
  },
  "immune": {
    textbook: { id:"1uV6BbQyFQMggADHuc_40OzgvLEjZqfxJ", label:"📖 ברונר 31-34", type:"file" },
    summary:  { id:"1TCIt74SjKUVMj-QppmMb-jOLyVctvfoY6_JsFeK9JtM", label:"📝 סיכום ברונר 31-34", type:"doc" },
    lectures: [
      { id:"1BPAFrBMY4VpkhJf6yNv5CWS71b8kh5of", label:"📄 מבוא למערכת חיסונית", type:"file" },
      { id:"12srfkb9bTuddOYQsH-kjim-EA8CqbrBT", label:"📄 AIDS", type:"file" },
      { id:"1QaXQR8Looh5Ywg3u61ahlnw_4ZzBUKWj", label:"📄 מחלות רקמת חיבור", type:"file" },
      { id:"1Ogo2_7ZYmvs5C3ZiS4JT5E9M2tRZhrTH", label:"📄 תגובה אלרגית", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=53328", label:"🎬 הקלטה 12.4", type:"url" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=53896", label:"🎬 הקלטה 26.4", type:"url" },
    ],
  },
  "skin": {
    textbook: { id:"1Yy3XmOuKxHsn1fj3GmsXoJXaSVnxAX13", label:"📖 ברונר 55-56", type:"file" },
    summary:  { id:"1LOiSVwH_pgmL43fPZG10OyZ6vp8N-NfrnTw6BcK_U3I", label:"📝 סיכום ברונר 55-56", type:"doc" },
    lectures: [
      { id:"10hV1MDebRIwPQ4blzACwQ8nYvdog7De4", label:"📄 בדיקות אבחון בעור", type:"file" },
      { id:"1PnOoBfMyj9n9Bko49MXatNaVGEDujb3G", label:"📄 מחלות דלקתיות ואלרגיה", type:"file" },
      { id:"1eotESJ8TFCKM_C8GCa9jqvmWXj37Z3Vb", label:"📄 מחלות זיהומיות", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=56275", label:"🎬 הקלטה 25.6", type:"url" },
    ],
  },
  "burns": {
    textbook: { id:"1gPEDxAbPxMWQEnLBPoGkM0g-9OCPcRPL", label:"📖 ברונר 57", type:"file" },
    summary:  { id:"1K-AcxYReTVn1G5sFtsSIUkzS_x4NYPYsCJQiB9Ha7HU", label:"📝 סיכום ברונר 57", type:"doc" },
  },
  "eyes": {
    textbook: { id:"1dZXTsYCCzUieoGjQlXeUP766MOOpr401", label:"📖 ברונר 58", type:"file" },
    summary:  { id:"1oOnCsfYudu8FmlpZnVYulMP0ZdD0ueE3mDqG04S2K28", label:"📝 סיכום ברונר 58", type:"doc" },
    lectures: [
      { id:"1ZRHEpVUuC1IUoho2ncTecFZNmJR8LvHa", label:"📄 אנטומיה ואומדן ראייה", type:"file" },
      { id:"13hgHC4XvgAPIr18eTRv0VKDdaI6jWUnF", label:"📄 גלאוקומה, קטרקט", type:"file" },
      { id:"1LlZmjPiECTPTAh6uJQ25qDjNKHfZQXr2", label:"📄 הפרעות ברשתית", type:"file" },
      { id:"1SNpEC0nEHOvCYuXO-4Rgyov55rWxtRz4", label:"📄 מחלות קרנית", type:"file" },
      { id:"1-l9SA9sKudZ135QQ2g8qv1RL5kgH50kQ", label:"📄 חבלות ומצבי חירום", type:"file" },
      { id:"14HExA5xnBEE83OYSxVy27jms0OzTMQCg", label:"📄 Conjunctivitis", type:"file" },
      { id:"1T5Lm7RaelOK83XyN2_XdChPGri_xJtFp", label:"📄 Refraction Errors", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=55652", label:"🎬 הקלטה 7.6", type:"url" },
    ],
  },
  "ent": {
    textbook: { id:"1TefxnbnPQmkyFTE2UidfTOAKxYvC2V9J", label:"📖 ברונר 59", type:"file" },
    summary:  { id:"1inhn3nEOlusqzy3E4kXn21hYvvgg_598WuNs7aw0-HU", label:"📝 סיכום ברונר 59", type:"doc" },
    lectures: [
      { id:"1aPF8rxnCefLl2gpLL8P2YYZkumzxSnN9", label:"📄 הקדמה לאאג", type:"file" },
      { id:"1e027xFEb0reDiNHhvbrT1b29F0TIicm4", label:"📄 האוזן", type:"file" },
      { id:"1LVtsUdazOidQQTIPBnz-VXRMKSLbYACO", label:"📄 האף", type:"file" },
      { id:"1pHPmldMJMiOpRXSjuz0h86JmUbxQRXcd", label:"📄 הצוואר", type:"file" },
      { id:"1t0BdKDF99f12trZM38Xp5XXzpX6bsUPd", label:"📄 הצוואר + סיכום (PPTX)", type:"file" },
      { id:"15sVykRmgQzvQH1Z9ziMrbsZ7wI2v9wf4", label:"📄 בדיקות שמיעה", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=54730", label:"🎬 הקלטה 19.5", type:"url" },
    ],
  },
  "neuro": {
    textbook: { id:"1tc98vpPJplSGHsRayaHjDdLGFswyXn1e", label:"📖 ברונר 60-65", type:"file" },
    summary:  { id:"1IRM26G6XSxzdLZg-KNVMQ5MtmSz4EgvItO_4nz4bx1M", label:"📝 סיכום ברונר 60-65", type:"doc" },
    lectures: [
      { id:"1ufI-nDwSFPapBMgrbns4Q21Cjosa86OE", label:"📄 מבוא למערכת העצבים", type:"file" },
      { id:"1hEzV52KSf-0cwxfl05jkJH5-WcNArTg2", label:"📄 הערכה נוירולוגית ובדיקות", type:"file" },
      { id:"1QmDoAkaC3xeI-dq4PZNX3dXJAry8Li3y", label:"📄 הערכה נוירופסיכולוגית", type:"file" },
      { id:"1HlaRp6J6DL4i53YvUhNFDyZQKtajo3r_", label:"📄 שבץ מוחי דימומי", type:"file" },
      { id:"1BtiGduLajVqhvrMDeY_-gkZwo35qA3cK", label:"📄 שבץ מוחי איסכמי", type:"file" },
      { id:"1yzezCD1uL1kgKKW_U46BAxWbcp-eYuCe", label:"📄 מיאסטניה וגיאן ברה", type:"file" },
      { id:"13bhuqFKUBHAmXQJQ7QKbgK0Tv9suPwHj", label:"📄 כאבי ראש", type:"file" },
      { id:"1KjP4RdYjazwSAdeQVQVKRUdgYerFMi8S", label:"📄 טרשת נפוצה", type:"file" },
      { id:"1A3M6YlSXa3bajRz-ec7RBQCczrYgsjgx", label:"📄 אפילפסיה ופרכוסים", type:"file" },
      { id:"1iMA1LdiBrA-Itkd33FsJCUd00ln1f7B6", label:"📄 זיהומים במעמ", type:"file" },
      { id:"1iYD1CtqNuVnjsGqmgQEvc62vO_ZiH12j", label:"📄 מחלות זיהומיות CJD", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=56037", label:"🎬 הקלטה 16.6", type:"url" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=56116", label:"🎬 הקלטה 18.6", type:"url" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=56183", label:"🎬 הקלטה 21.6", type:"url" },
    ],
  },
  "musculoskeletal": {
    textbook: { id:"1mvpklDzd4qJLnbhpD_3Cri3Ax46UdU0L", label:"📖 ברונר 35-37", type:"file" },
    summary:  { id:"1epjA-lshCc-2IOnXmENi6a2ZPbLtra2cozzWbMoV_8w", label:"📝 סיכום ברונר 35-37", type:"doc" },
    lectures: [
      { id:"1XwUsykp2DP0fjD6mhGmRWz1e8-LXKy2H", label:"📄 מבוא לאורטופדיה", type:"file" },
      { id:"1bnCqxwTJfS6m9nDJufTCqQS7cPiJcX6O", label:"📄 אומדן ובדיקה פיזיקלית", type:"file" },
      { id:"16nyNnEOENyZY37CB0qhZJtyDWPFiN9oD", label:"📄 הדמייה", type:"file" },
      { id:"18yCCWd-ZlMaWcnMzPswh71jcIAjkoIcH", label:"📄 טרואמה וכירורגיה", type:"file" },
      { id:"1f96v5Tk50KUzVDjs2B7nKs7MzXx8W7L2", label:"📄 סיעוד אורטופדי", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=55537", label:"🎬 הקלטה 2.6", type:"url" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=56252", label:"🎬 הקלטה 23.6", type:"url" },
    ],
  },
  "oncology": {
    textbook: { id:"1ep4y5yTajntUCYiWPXEi9OltBwmnWOZz", label:"📖 ברונר 12-13", type:"file" },
    summary:  { id:"1-DzHea12-lbhvYp7L0vpKfa_YmxZsYPApcKhzUpRRag", label:"📝 סיכום ברונר 12-13", type:"doc" },
    lectures: [
      { id:"1xL-gTqSwGAVkaEknWqzG5bOgsGwwwegx", label:"📄 מבוא לאונקולוגיה", type:"file" },
      { id:"16HWI4NwoJYhw01hE7MhOIhPnE6ZRPYTf", label:"📄 הטיפול האונקולוגי", type:"file" },
      { id:"1NNgLpOk9tKVMDxukhjb41CuqiHUotSmU", label:"📄 מצבי חירום באונקולוגיה", type:"file" },
      { id:"1PJdpxMa4tleSUFDjCvcD0X-ZRdXOeIF1", label:"📄 טיפול תומך", type:"file" },
    ],
  },
  "hematology": {
    textbook: { id:"1cPtiIGCcNZuERx8iq3tpjQKt4R2IxPGD", label:"📖 ברונר 28-30", type:"file" },
    summary:  { id:"1ZMFO9jHrdt7v5pL-cRol9psGMPomfISz86jhEleuuhY", label:"📝 סיכום ברונר 28-30", type:"doc" },
    lectures: [
      { id:"1a3LwBzYAmoKbzmWZkfIVyJrwRZcdokXa", label:"📄 Hematology - Br15", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=55245", label:"🎬 הקלטה 26.5", type:"url" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=55535", label:"🎬 הקלטה 2.6", type:"url" },
    ],
  },
  "breast": {
    textbook: { id:"1_cQasyKXKAP-TvcwDaCvnAl094wklHPI", label:"📖 ברונר 52", type:"file" },
    summary:  { id:"1l_CNHzl7HZB2eZSrEPGEibrqdOMA46pHbkqvy4x2eIk", label:"📝 סיכום ברונר 52", type:"doc" },
    lectures: [
      { id:"1yOHTs_y0BSq7FdJ3zt-8-uYnr1CpmwZU", label:"📄 מחלות שד - ברונר 2025", type:"file" },
      { url:"https://tasmc.centricapp.co.il/mod/url/view.php?id=56251", label:"🎬 הקלטה 23.6", type:"url" },
    ],
  },
};

// ── בונה את TOPIC_LINKS שהאפליקציה צורכת (אין צורך לגעת) ──
const D  = id => `https://drive.google.com/file/d/${id}/view`;
const GD = id => `https://docs.google.com/document/d/${id}/view`;
const _linkURL = e => ({ url: e.type === 'url' ? e.url : (e.type === 'doc' ? GD : D)(e.id), label: e.label });
const TOPIC_LINKS = Object.fromEntries(Object.entries(COURSE_LINKS).map(([k, v]) => {
  const arr = [];
  if (v.textbook) arr.push(_linkURL(v.textbook));
  if (v.summary)  arr.push(_linkURL(v.summary));
  (v.lectures || []).forEach(e => arr.push(_linkURL(e)));
  (v.links || []).forEach(e => arr.push(_linkURL(e)));
  return [k, arr];
}));
