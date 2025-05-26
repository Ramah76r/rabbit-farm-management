export const RABBIT_BREEDS = [
  "نيوزيلندي أبيض",
  "كاليفورنيا",
  "ركس",
  "فلمش جاينت",
  "هولندي قزم",
  "أنجورا",
  "هوت",
  "ساتان",
  "بلجيكي عملاق",
  "جرسي وولي",
  "أخرى"
];

export const RABBIT_GENDERS = ["ذكر", "أنثى"];

export const RABBIT_STATUSES = [
  "نشط",
  "حامل",
  "مريض",
  "للبيع",
  "غير نشط",
  "نافق"
];

export const HEALTH_STATUSES = [
  "سليم",
  "مريض",
  "تحت العلاج",
  "في فترة نقاهة"
];

export const BREEDING_STATUSES = [
  "في انتظار الولادة",
  "ولادة ناجحة",
  "فشل"
];

export const HEALTH_RECORD_TYPES = [
  "تطعيم",
  "علاج",
  "فحص دوري",
  "مرض",
  "إصابة",
  "أخرى"
];

export const FEED_TYPES = [
  "علف جاف",
  "برسيم أخضر",
  "جزر",
  "خس",
  "طعام مخصص",
  "أخرى"
];

export const USER_ROLES = [
  "admin",
  "manager",
  "worker"
];

export const USER_ROLE_LABELS: Record<string, string> = {
  "admin": "مدير النظام",
  "manager": "مدير المزرعة",
  "worker": "عامل"
};

export const TASK_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "canceled"
];

export const TASK_STATUS_LABELS: Record<string, string> = {
  "pending": "قيد الانتظار",
  "in_progress": "قيد التنفيذ",
  "completed": "مكتمل",
  "canceled": "ملغي"
};

export const ACTIVITY_TYPES = [
  "login",
  "create",
  "update",
  "delete"
];

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  "login": "تسجيل دخول",
  "create": "إضافة",
  "update": "تعديل",
  "delete": "حذف"
};

export const ENTITY_TYPES = [
  "user",
  "rabbit",
  "breeding",
  "health",
  "feed",
  "task"
];

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  "user": "مستخدم",
  "rabbit": "أرنب",
  "breeding": "تكاثر",
  "health": "صحة",
  "feed": "علف",
  "task": "مهمة"
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: "rabbit_farm_auth_token",
  USER: "rabbit_farm_user",
  RABBITS: "rabbit_farm_rabbits",
  BREEDING_RECORDS: "rabbit_farm_breeding_records",
  HEALTH_RECORDS: "rabbit_farm_health_records",
  FEED_INVENTORY: "rabbit_farm_feed_inventory",
  FEED_CONSUMPTION: "rabbit_farm_feed_consumption",
  TASKS: "rabbit_farm_tasks",
  ACTIVITIES: "rabbit_farm_activities",
  SETTINGS: "rabbit_farm_settings"
};
