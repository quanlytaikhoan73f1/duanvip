// ============================
// MODULE 1: CÔNG TRÌNH & TẦNG
// ============================
export type ConstructionStatus = 'planning' | 'active' | 'paused' | 'completed';
export type FloorStatus = 'not_started' | 'in_progress' | 'completed';

export interface Floor {
  id: string;
  constructionId: string;
  name: string; // "Tầng trệt", "Tầng 1", "Mái"
  plannedVolume: number; // Khối lượng kế hoạch
  completedVolume: number; // Khối lượng hoàn thành (cộng dồn từ báo cáo ngày)
  unit: string; // "m²", "m³", "bộ"
  contractValue: number; // Giá trị hợp đồng tầng (VNĐ)
  retentionRate: number; // % bảo lưu (e.g. 5 = 5%)
  status: FloorStatus;
}

export interface Construction {
  id: string;
  name: string; // "Nhà phố Quận 7 - Ông Minh"
  address: string;
  contractValue: number; // Tổng giá trị hợp đồng
  startDate: string; // ISO "YYYY-MM-DD"
  expectedEndDate: string;
  status: ConstructionStatus;
  retentionRate: number; // % bảo lưu chung
  floors: Floor[];
}

// ==============================
// MODULE 2: TỔ ĐỘI & PHÂN CÔNG
// ==============================
export type WorkerRole = 'leader' | 'member';

export interface Worker {
  id: string;
  name: string;
  phone?: string;
  teamId: string;
  role: WorkerRole;
}

export interface Team {
  id: string;
  name: string; // "Tổ An", "Tổ Khoa"
  leaderId: string;
  memberIds: string[];
}

export type AssignmentStatus = 'active' | 'completed';

export interface Assignment {
  id: string;
  teamId: string;
  constructionId: string;
  floorId: string; // Khóa vị trí: phân công tầng cụ thể
  startDate: string;
  endDate?: string;
  status: AssignmentStatus;
}

// =======================
// MODULE 3: BÁO CÁO NGÀY
// =======================
export type AttendanceMark = 'O' | 'N' | 'X'; // Full day / Nửa ngày / Vắng

export interface AttendanceEntry {
  workerId: string;
  mark: AttendanceMark;
  unitPrice: number; // Đơn giá ngày công (VNĐ)
  wage: number; // Tiền công = unitPrice * (O=1, N=0.5, X=0)
}

export type ReportStatus = 'draft' | 'submitted';

export interface DailyReport {
  id: string;
  date: string; // "YYYY-MM-DD"
  teamId: string;
  constructionId: string;
  floorId: string;
  submittedBy: string; // leaderId
  completedVolume: number; // Khối lượng hoàn thành hôm nay
  foodExpense: number; // Tiền ăn (VNĐ)
  materialExpense: number; // Chi phí vật tư (VNĐ)
  otherExpense: number; // Chi phí khác
  notes: string;
  status: ReportStatus;
  attendance: AttendanceEntry[];
  submittedAt?: string;
}

// ==============================
// MODULE 4: ĐIỀU PHỐI NHÂN SỰ
// ==============================
export type RequestType = 'add' | 'remove' | 'transfer';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface PersonnelRequest {
  id: string;
  type: RequestType;
  requestedBy: string; // leaderId
  teamId: string;
  workerName?: string; // Dùng khi type='add' - tên người mới
  workerId?: string; // Dùng khi type='remove' | 'transfer'
  fromConstructionId?: string;
  fromFloorId?: string;
  toConstructionId?: string;
  toFloorId?: string;
  reason: string;
  status: RequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

// ================
// ROOT STATE
// ================
export interface AppData {
  constructions: Construction[];
  workers: Worker[];
  teams: Team[];
  assignments: Assignment[];
  dailyReports: DailyReport[];
  personnelRequests: PersonnelRequest[];
}

// ================
// DERIVED/UI TYPES
// ================
export interface FloorStats {
  progress: number; // 0-100
  retentionAmount: number; // VNĐ (giá trị bảo lưu)
}

export interface ConstructionStats {
  totalProgress: number; // % weighted
  totalRetention: number; // Tổng tiền bảo lưu
  totalExpense: number; // Tổng chi phí từ báo cáo ngày
  activeTeams: number;
  workerCount: number;
}
