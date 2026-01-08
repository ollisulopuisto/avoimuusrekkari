export interface RegisterNotification {
  id: number;
  diaryNumber: string;
  companyName: string;
  companyId: string; // Business ID (Y-tunnus)
  mainIndustry: string;
  description: string;
  registrationDate: string;
  company?: {
    location?: string; // If available in company details
  };
}

export interface ActivityNotification {
  id: number;
  diaryNumber: string;
  companyName: string;
  companyId: string;
  description?: string; // Sometimes activity notifications have descriptions
  activityAmount: "many" | "minimal" | "none";
  termId: number;
  term?: Term;
  topics?: ActivityTopic[];
  reportingStartDate: string;
  reportingEndDate: string;
}

export interface ActivityTopic {
  id: number;
  title: string;
  activityType: "direct" | "guidance" | "contact_for_customer" | "personal";
  contactTopicType: "project" | "other";
  contactTopicOther?: string; // This is where "CER" might be
  contactTopicProject?: {
    projectId: string; // e.g. Hanke ID
    fi?: string;
    en?: string;
    sv?: string;
  };
  contactedTargets?: ActivityTarget[];
}

export interface ActivityTarget {
  id: number;
  contactedTargetId?: number;
  contactMethods: string[];
  contactedTarget?: {
    id: number;
    fi?: TargetInfo;
    en?: TargetInfo;
    sv?: TargetInfo;
  };
}

export interface TargetRegistryItem {
  id: number;
  fi?: TargetInfo;
  sv?: TargetInfo;
  en?: TargetInfo;
}

export interface TargetInfo {
  id: number;
  organization: string;
  department?: string;
  title?: string;
  name: string;
}

export interface Term {
  id: number;
  title?: string;
  reportingStartDate: string;
  reportingEndDate: string;
}

// Response wrappers
export type RegisterNotificationResponse = RegisterNotification[];
export type ActivityNotificationResponse = ActivityNotification[];
