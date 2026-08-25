import React, { createContext, useContext, useEffect, useState } from "react";

export type AppLanguage = "ja" | "en" | "zh-CN";

const STORAGE_KEY = "starrail-build-advisor.language";

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  ja: "日本語",
  en: "English",
  "zh-CN": "简体中文",
};

const copy = {
  ja: {
    language: "言語", updates: "更新履歴", lookup: "照会", backToLookup: "照会画面へ",
    publicBuildIntelligence: "公開ビルド分析", uidOnly: "UIDのみ", archiveAccess: "公開プロフィールを照会",
    lookupUid: "UIDを照会", retrieve: "照会する", publicOnly: "公開設定済みのプロフィール情報のみを参照します。",
    uidSaved: "直近に照会したUIDは、この端末内にゲーム別で保存されます。",
    thirdParty: "第三者の公開データサービスを一時参照します。本サイトは各ゲームの公式・公認サービスではありません。",
    retrieving: "公開プロフィールを取得中", archive: "公開記録", characterSelector: "キャラクター選択", publicCharacters: "公開キャラクター",
    currentBuild: "現在のビルド", currentEquipment: "現在の装備", currentStats: "現在のステータス", estimatedFinalStats: "推定最終ステータス",
    targetMatrix: "目標ステータス", targetDescription: "同一ステータスごとに現在値を照合します。緑は達成済み、赤は未達成、横線は公開データに値がない状態です。",
    guideDataAsOf: "ガイド基準日", lastCurated: "最終更新日", referenceScope: "参照範囲", stat: "ステータス", current: "現在値",
    curatedRecommendation: "推奨ビルド", mainStats: "主ステータス", nextUpgrade: "優先して強化する項目", relativeDeficit: "目標水準までの相対的な不足量で判定",
    equipmentAction: "装備アクション", allTargetsMet: "公開データで比較できる目標ステータスは、すべて目標水準に到達しています。未取得のステータスは個別に確認してください。",
    equippedSets: "装備中のセット", pieces: "部位", guideHistory: "更新履歴", curationLog: "更新記録 / データ時系列",
    historyIntro: "目標ステータスの更新時点、参照範囲、キャラクター別の採用プロファイルを確認できます。履歴は現在記録している基準日以降を表示します。",
    loadingHistory: "更新履歴を取得中", baseline: "現在の基準日", registeredGuides: "登録済みガイド", updatePolicy: "更新方針",
    policyDescription: "外部公開ガイドの照合後に、目標値と参照範囲を更新します。", siteWideChanges: "サイト全体の更新", characterRecords: "キャラクター別更新",
    all: "すべて", searchCharacter: "キャラクター名を検索", character: "キャラクター", profile: "プロファイル", dataAsOf: "基準日", reference: "参照", history: "履歴", rationale: "理由",
    records: "件", updated: "更新", cached: "キャッシュ", updateCoverage: "個別更新の進捗", reviewedRecords: "精査完了", pendingReview: "再調査待ち", nextReviewBatch: "次回の10名バッチ", reviewCriteria: "公開条件", individualPriority: "個別優先度", sourceNotice: "キャラクター名・装備名・数値は公開ゲームデータに基づいて表示されます。",
    selectedRecord: "選択中の記録", currentProfile: "現在の装備 / プロファイル", target: "目標", recommended: "厳選", acceptable: "妥協", changeMainStat: "主ステータスを変更", rollSubstats: "サブステータスを厳選", highest: "最優先", priority: "優先", secondary: "次点",
    lightCone: "光円錐", weapon: "武器", wEngine: "音動機", relics: "遺物", artifacts: "聖遺物", driveDiscs: "ドライバディスク",
    howItWorks: "利用手順 / 01—03", profileSetup: "公開設定", inputUid: "UIDを入力", nextStep: "次の一手", profileSetupBody: "ゲーム内プロフィールに確認したいキャラクターを登録します。", inputUidBody: "UIDを入力して、公開データを照会します。", nextStepBody: "装備と各目標水準を比較し、未達ステータスを見つけます。",
    hsrDescription: "公開中のキャラクター装備を読み込み、遺物と目標ステータスを比較します。", genshinDescription: "公開中のキャラクター、武器、聖遺物を読み込み、目標ステータスと比較します。", zzzDescription: "公開中のエージェント、音動機、ドライバディスクを読み込み、目標ステータスと比較します。",
    translationFeedback: "翻訳フィードバック", feedbackTitle: "翻訳へのご意見", feedbackIntro: "誤訳や、より分かりやすい表現の提案をお寄せください。内容は翻訳品質の見直しに活用します。", feedbackType: "報告の種類", mistranslation: "誤訳", translationImprovement: "表現の改善", otherFeedback: "その他", displayLanguage: "表示言語", originalText: "該当する文言（任意）", suggestedText: "改善案・正しい表現", feedbackNotes: "補足・文脈（任意）", feedbackPage: "対象画面", feedbackPrivacy: "個人情報、アカウント情報、UIDは入力しないでください。", sendFeedback: "フィードバックを送信", sendingFeedback: "送信中", feedbackSent: "ありがとうございます。改善候補として受け付けました。", feedbackFailed: "送信できませんでした。時間をおいて再度お試しください。", feedbackRequired: "改善案・正しい表現を3文字以上入力してください。", feedbackManagement: "フィードバック管理", feedbackManagementIntro: "送信された翻訳フィードバックを確認し、対応状況を更新します。", adminOnly: "この画面は管理者のみ利用できます。", adminAccess: "管理者", adminSignInTitle: "管理者ログイン", adminSignInDescription: "管理ダッシュボードを開くには、管理者アカウントでログインしてください。", adminSignIn: "管理者としてログイン", signIn: "ログイン", loading: "読み込み中", feedbackCount: "件のフィードバック", receivedAt: "受付日時", sourcePage: "報告元", responseStatus: "対応状況", statusNew: "未対応", statusInProgress: "対応中", statusResolved: "完了", statusUpdated: "対応状況を更新しました。", updateFailed: "対応状況を更新できませんでした。", noFeedback: "現在、確認待ちのフィードバックはありません。", feedbackSuggestion: "提案内容", lookupDashboard: "照会ダッシュボード", lookupDashboardIntro: "成功した公開UID照会を匿名で集計します。UIDや利用者情報は保存しません。", totalLookups: "照会回数", cacheHits: "キャッシュ利用", cacheMisses: "外部取得", cacheHitRate: "キャッシュ利用率", gameBreakdown: "ゲーム別内訳", dashboardFilters: "集計フィルター", startDate: "開始日", endDate: "終了日", gameFilter: "ゲームタイトル", allGames: "すべてのゲーム", applyFilters: "適用する", resetFilters: "リセット", invalidDateRange: "終了日は開始日以降を指定してください。",
  },
  en: {
    language: "Language", updates: "Update History", lookup: "Lookup", backToLookup: "Back to Lookup",
    publicBuildIntelligence: "PUBLIC BUILD INTELLIGENCE", uidOnly: "UID ONLY", archiveAccess: "PUBLIC PROFILE LOOKUP",
    lookupUid: "Look up UID", retrieve: "Search", publicOnly: "Only publicly shared profile information is queried.",
    uidSaved: "The most recently searched UID is saved per game on this device.",
    thirdParty: "This site temporarily uses third-party public data services and is not an official or authorized service for any game.",
    retrieving: "RETRIEVING PUBLIC PROFILE", archive: "ARCHIVE", characterSelector: "CHARACTER SELECTOR", publicCharacters: "Public Characters",
    currentBuild: "Current Build", currentEquipment: "CURRENT EQUIPMENT", currentStats: "CURRENT STATS", estimatedFinalStats: "ESTIMATED FINAL STATS",
    targetMatrix: "Target Stats", targetDescription: "Current values are compared per stat. Green means achieved; red means below target; a dash means the public data has no value.",
    guideDataAsOf: "GUIDE DATA AS OF", lastCurated: "LAST CURATED", referenceScope: "REFERENCE SCOPE", stat: "STAT", current: "CURRENT",
    curatedRecommendation: "Curated Build", mainStats: "MAIN STATS", nextUpgrade: "Priority Upgrades", relativeDeficit: "Ranked by relative gap to the target tier",
    equipmentAction: "EQUIPMENT ACTION", allTargetsMet: "All target stats available in the public data have reached the target tier. Review missing values individually.",
    equippedSets: "Equipped Sets", pieces: "PIECES", guideHistory: "Update History", curationLog: "CURATION LOG / DATA TIMELINE",
    historyIntro: "Review target-stat update dates, reference scopes, and the selected profile for each character. The log starts from the current recorded baseline.",
    loadingHistory: "LOADING CURATION LOG", baseline: "CURRENT BASELINE", registeredGuides: "REGISTERED GUIDES", updatePolicy: "UPDATE POLICY",
    policyDescription: "Target values and reference scope are revised after cross-checking public build guides.", siteWideChanges: "Site-wide Changes", characterRecords: "Character Updates",
    all: "All", searchCharacter: "Search character", character: "CHARACTER", profile: "PROFILE", dataAsOf: "DATA AS OF", reference: "REFERENCE", history: "HISTORY", rationale: "RATIONALE",
    records: "RECORDS", updated: "Updated", cached: "Cached", updateCoverage: "Individual Update Coverage", reviewedRecords: "Reviewed", pendingReview: "Pending review", nextReviewBatch: "Next batch of ten", reviewCriteria: "Release criteria", individualPriority: "INDIVIDUAL PRIORITY", sourceNotice: "Character names, equipment names, and values are shown from public game data.",
    selectedRecord: "SELECTED RECORD", currentProfile: "CURRENT EQUIPMENT / PROFILE", target: "Target", recommended: "Optimized", acceptable: "Baseline", changeMainStat: "Change Main Stat", rollSubstats: "Roll Substats", highest: "Highest", priority: "Priority", secondary: "Secondary",
    lightCone: "Light Cone", weapon: "Weapon", wEngine: "W-Engine", relics: "Relics", artifacts: "Artifacts", driveDiscs: "Drive Discs",
    howItWorks: "HOW IT WORKS / 01—03", profileSetup: "Share Profile", inputUid: "Enter UID", nextStep: "Next Step", profileSetupBody: "Add the character you want to review to your in-game public profile.", inputUidBody: "Enter the UID to retrieve public data.", nextStepBody: "Compare equipment and target tiers to identify stats below target.",
    hsrDescription: "Load publicly shared character equipment and compare relics against target stats.", genshinDescription: "Load publicly shared characters, weapons, and artifacts and compare them against target stats.", zzzDescription: "Load publicly shared agents, W-Engines, and Drive Discs and compare them against target stats.",
    translationFeedback: "Translation Feedback", feedbackTitle: "Help Improve Translations", feedbackIntro: "Report a mistranslation or propose clearer wording. Reports are used to review and improve translation quality.", feedbackType: "Feedback type", mistranslation: "Mistranslation", translationImprovement: "Wording improvement", otherFeedback: "Other", displayLanguage: "Display language", originalText: "Text to improve (optional)", suggestedText: "Suggested wording", feedbackNotes: "Context or notes (optional)", feedbackPage: "Page", feedbackPrivacy: "Do not enter personal, account, or UID information.", sendFeedback: "Send feedback", sendingFeedback: "Sending", feedbackSent: "Thank you. Your report has been received as an improvement candidate.", feedbackFailed: "Feedback could not be sent. Please try again later.", feedbackRequired: "Enter at least 3 characters for the suggested wording.", feedbackManagement: "Feedback Management", feedbackManagementIntro: "Review submitted translation feedback and update its response status.", adminOnly: "This page is available to administrators only.", adminAccess: "Admin", adminSignInTitle: "Administrator Sign-in", adminSignInDescription: "Sign in with an administrator account to open the management dashboard.", adminSignIn: "Sign in as administrator", signIn: "Sign in", loading: "Loading", feedbackCount: "feedback items", receivedAt: "Received", sourcePage: "Source page", responseStatus: "Response status", statusNew: "New", statusInProgress: "In progress", statusResolved: "Resolved", statusUpdated: "Response status updated.", updateFailed: "Response status could not be updated.", noFeedback: "There is no feedback to review yet.", feedbackSuggestion: "Suggested wording", lookupDashboard: "Lookup Dashboard", lookupDashboardIntro: "Successful public UID lookups are aggregated anonymously. No UID or user information is retained.", totalLookups: "Lookups", cacheHits: "Cache hits", cacheMisses: "External fetches", cacheHitRate: "Cache hit rate", gameBreakdown: "By game", dashboardFilters: "Filters", startDate: "Start date", endDate: "End date", gameFilter: "Game", allGames: "All games", applyFilters: "Apply", resetFilters: "Reset", invalidDateRange: "End date must be on or after the start date.",
  },
  "zh-CN": {
    language: "语言", updates: "更新记录", lookup: "查询", backToLookup: "返回查询",
    publicBuildIntelligence: "公开配装分析", uidOnly: "仅 UID", archiveAccess: "公开资料查询",
    lookupUid: "查询 UID", retrieve: "查询", publicOnly: "仅查询已公开的个人资料信息。",
    uidSaved: "最近查询的 UID 会按游戏保存在此设备上。",
    thirdParty: "本网站会临时使用第三方公开数据服务，非任何游戏的官方或授权服务。",
    retrieving: "正在获取公开资料", archive: "公开记录", characterSelector: "角色选择", publicCharacters: "公开角色",
    currentBuild: "当前配装", currentEquipment: "当前装备", currentStats: "当前属性", estimatedFinalStats: "预估最终属性",
    targetMatrix: "目标属性", targetDescription: "按属性比较当前数值。绿色为已达成，红色为未达成，横线表示公开数据中没有该数值。",
    guideDataAsOf: "指南基准日", lastCurated: "最后更新日", referenceScope: "参考范围", stat: "属性", current: "当前",
    curatedRecommendation: "推荐配装", mainStats: "主属性", nextUpgrade: "优先强化项目", relativeDeficit: "按与目标档位的相对缺口排序",
    equipmentAction: "装备操作", allTargetsMet: "公开数据中可比较的目标属性均已达到目标档位。请单独确认缺失数值。",
    equippedSets: "已装备套装", pieces: "部位", guideHistory: "更新记录", curationLog: "维护记录 / 数据时间线",
    historyIntro: "可查看目标属性的更新时间、参考范围以及每位角色采用的配装模板。记录从当前基准日开始显示。",
    loadingHistory: "正在加载维护记录", baseline: "当前基准日", registeredGuides: "已登记指南", updatePolicy: "更新政策",
    policyDescription: "在核对公开配装指南后更新目标数值与参考范围。", siteWideChanges: "全站更新", characterRecords: "角色更新",
    all: "全部", searchCharacter: "搜索角色", character: "角色", profile: "模板", dataAsOf: "基准日", reference: "参考", history: "历史", rationale: "原因",
    records: "条", updated: "更新", cached: "缓存", updateCoverage: "角色个别更新进度", reviewedRecords: "已复核", pendingReview: "待复核", nextReviewBatch: "下一批十名", reviewCriteria: "发布条件", individualPriority: "角色优先级", sourceNotice: "角色名、装备名和数值依据公开游戏数据展示。",
    selectedRecord: "当前记录", currentProfile: "当前装备 / 模板", target: "目标", recommended: "毕业", acceptable: "过渡", changeMainStat: "更换主属性", rollSubstats: "筛选副属性", highest: "最高优先", priority: "优先", secondary: "次要",
    lightCone: "光锥", weapon: "武器", wEngine: "音擎", relics: "遗器", artifacts: "圣遗物", driveDiscs: "驱动盘",
    howItWorks: "使用步骤 / 01—03", profileSetup: "公开设置", inputUid: "输入 UID", nextStep: "下一步", profileSetupBody: "在游戏内个人资料中展示需要查看的角色。", inputUidBody: "输入 UID 以查询公开数据。", nextStepBody: "比较装备与各项目标档位，找出未达标属性。",
    hsrDescription: "读取公开的角色装备，并将遗器与目标属性进行比较。", genshinDescription: "读取公开的角色、武器和圣遗物，并将其与目标属性进行比较。", zzzDescription: "读取公开的代理人、音擎和驱动盘，并将其与目标属性进行比较。",
    translationFeedback: "翻译反馈", feedbackTitle: "帮助改进翻译", feedbackIntro: "欢迎报告误译或提出更清晰的表达建议。我们会将报告用于审查和改进翻译质量。", feedbackType: "反馈类型", mistranslation: "误译", translationImprovement: "措辞改进", otherFeedback: "其他", displayLanguage: "显示语言", originalText: "需要改进的文案（可选）", suggestedText: "建议表达", feedbackNotes: "上下文或备注（可选）", feedbackPage: "页面", feedbackPrivacy: "请勿填写个人信息、账号信息或 UID。", sendFeedback: "发送反馈", sendingFeedback: "发送中", feedbackSent: "感谢您的反馈。该报告已作为改进候选内容接收。", feedbackFailed: "无法发送反馈，请稍后重试。", feedbackRequired: "请为建议表达至少输入3个字符。", feedbackManagement: "反馈管理", feedbackManagementIntro: "查看已提交的翻译反馈并更新处理状态。", adminOnly: "此页面仅限管理员使用。", adminAccess: "管理", adminSignInTitle: "管理员登录", adminSignInDescription: "请使用管理员账号登录以打开管理仪表盘。", adminSignIn: "以管理员身份登录", signIn: "登录", loading: "加载中", feedbackCount: "条反馈", receivedAt: "接收时间", sourcePage: "来源页面", responseStatus: "处理状态", statusNew: "未处理", statusInProgress: "处理中", statusResolved: "已完成", statusUpdated: "处理状态已更新。", updateFailed: "无法更新处理状态。", noFeedback: "目前没有需要审核的反馈。", feedbackSuggestion: "建议表达", lookupDashboard: "查询仪表盘", lookupDashboardIntro: "仅对成功的公开UID查询进行匿名汇总，不保存UID或用户信息。", totalLookups: "查询次数", cacheHits: "缓存命中", cacheMisses: "外部获取", cacheHitRate: "缓存命中率", gameBreakdown: "按游戏统计", dashboardFilters: "筛选条件", startDate: "开始日期", endDate: "结束日期", gameFilter: "游戏", allGames: "全部游戏", applyFilters: "应用", resetFilters: "重置", invalidDateRange: "结束日期必须不早于开始日期。",
  },
} as const;

export type TranslationKey = keyof typeof copy.ja;

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function storedLanguage(): AppLanguage {
  const value = typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
  return value === "en" || value === "zh-CN" || value === "ja" ? value : "ja";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(storedLanguage);
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t: (key) => copy[language][key] }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used within LanguageProvider");
  return value;
}
