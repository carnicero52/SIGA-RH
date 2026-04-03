// =====================
// Common Types
// =====================
export interface Company {
  id: string; name: string; taxId?: string; logo?: string;
  address?: string; city?: string; state?: string; country?: string;
  phone?: string; email?: string; website?: string; active: boolean;
  createdAt: string; updatedAt: string;
}

export interface Branch {
  id: string; companyId: string; name: string; code?: string;
  address?: string; city?: string; state?: string;
  latitude: number; longitude: number; geofenceRadius: number;
  phone?: string; managerName?: string; active: boolean;
  createdAt: string; updatedAt: string;
  _count?: { employees: number; attendanceRecords: number };
}

export interface Department {
  id: string; companyId: string; name: string; description?: string;
  managerName?: string; active: boolean;
  createdAt: string; updatedAt: string;
  _count?: { employees: number; positions: number };
}

export interface Position {
  id: string; companyId: string; departmentId: string; name: string;
  description?: string; salary?: number; active: boolean;
  createdAt: string; updatedAt: string;
  department?: Department;
  _count?: { employees: number };
}

export interface Employee {
  id: string; companyId: string; branchId?: string; departmentId?: string; positionId?: string;
  firstName: string; lastName: string; email: string; phone?: string;
  curp?: string; rfc?: string; nss?: string; birthDate?: string; gender?: string;
  address?: string; city?: string; state?: string;
  employeeNumber?: string; hireDate?: string; employmentType: string; status: string;
  photo?: string; bloodType?: string;
  emergencyContact?: string; emergencyPhone?: string; emergencyRelation?: string;
  bankName?: string; bankAccount?: string; bankClabe?: string;
  notes?: string; active: boolean;
  createdAt: string; updatedAt: string;
  // Relations
  branch?: Branch; department?: Department; position?: Position;
  _count?: { attendanceRecords: number; contracts: number; incidents: number; documents: number };
}

export interface Shift {
  id: string; companyId: string; name: string; startTime: string; endTime: string;
  breakMinutes: number; toleranceMinutes: number; type: string; color: string;
  active: boolean; createdAt: string; updatedAt: string;
  _count?: { employeeShifts: number };
}

export interface EmployeeShift {
  id: string; employeeId: string; shiftId: string; effectiveDate: string;
  endDate?: string; daysOfWeek: string; active: boolean;
  createdAt: string; updatedAt: string;
  employee?: Employee; shift?: Shift;
}

export interface QRCode {
  id: string; branchId: string; code: string; expiresAt: string;
  active: boolean; createdAt: string;
  branch?: Branch;
}

export interface AttendanceRecord {
  id: string; companyId: string; branchId: string; employeeId: string; qrCodeId?: string;
  recordType: string; recordTime: string; scheduledTime?: string;
  latitude?: number; longitude?: number; gpsAccuracy?: number;
  selfieUrl?: string; status: string; minutesDiff?: number;
  fraudFlags?: string; deviceInfo?: string; ipAddress?: string;
  notes?: string; verified: boolean; verifiedBy?: string; verifiedAt?: string;
  createdAt: string;
  employee?: Employee; branch?: Branch; qrCode?: QRCode;
}

export interface ContractTemplate {
  id: string; companyId: string; name: string; type: string; content: string;
  defaultDurationDays?: number; active: boolean;
  createdAt: string; updatedAt: string;
  _count?: { contracts: number };
}

export interface Contract {
  id: string; templateId: string; employeeId: string; companyId: string;
  content: string; startDate: string; endDate?: string; status: string;
  signedAt?: string; signedDocumentUrl?: string; notes?: string;
  createdAt: string; updatedAt: string;
  template?: ContractTemplate; employee?: Employee;
}

export interface Incident {
  id: string; companyId: string; employeeId: string; reportedBy?: string;
  type: string; title: string; description: string; severity: string;
  date: string; status: string; witnesses?: string; sanctions?: string;
  resolution?: string; resolvedAt?: string; resolvedBy?: string;
  createdAt: string; updatedAt: string;
  employee?: Employee;
}

export interface Vacant {
  id: string; companyId: string; departmentId?: string; positionId?: string;
  title: string; description?: string; requirements?: string;
  salaryMin?: number; salaryMax?: number; employmentType: string;
  location?: string; status: string; vacanciesCount: number;
  publishedAt?: string; closesAt?: string;
  createdAt: string; updatedAt: string;
  department?: Department; position?: Position;
  _count?: { candidates: number };
}

export interface Candidate {
  id: string; vacantId: string; companyId: string;
  firstName: string; lastName: string; email: string; phone?: string;
  cvUrl?: string; coverLetter?: string; status: string;
  interviewDate?: string; notes?: string;
  createdAt: string; updatedAt: string;
  vacant?: Vacant;
}

export interface Document {
  id: string; employeeId: string; type: string; name: string;
  fileUrl?: string; fileSize?: number; notes?: string;
  uploadedAt: string;
}

export interface AppNotification {
  id: string; companyId: string; employeeId?: string;
  type: string; title: string; message: string; read: boolean;
  createdAt: string;
  employee?: Employee;
}

// =====================
// Dashboard Stats
// =====================
export interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  presentToday: number
  lateToday: number
  absentToday: number
  totalBranches: number
  totalDepartments: number
  openIncidents: number
  openVacancies: number
  pendingContracts: number
  attendanceByDay: { date: string; present: number; late: number; absent: number }[]
  attendanceByBranch: { branch: string; count: number }[]
  employeesByDepartment: { department: string; count: number }[]
  employeesByStatus: { status: string; count: number }[]
  recentAttendance: AttendanceRecord[]
  upcomingBirthdays: { name: string; date: string }[]
}

// =====================
// Status helpers
// =====================
export const employmentTypeLabels: Record<string, string> = {
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  contract: 'Por Contrato',
}

export const employeeStatusLabels: Record<string, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  on_leave: 'Con Permiso',
  terminated: 'Baja',
}

export const attendanceStatusLabels: Record<string, string> = {
  on_time: 'A Tiempo',
  late: 'Retardo',
  early_departure: 'Salida Anticipada',
  absent: 'Ausente',
  fraud_detected: 'Fraude Detectado',
}

export const incidentTypeLabels: Record<string, string> = {
  absence: 'Inasistencia',
  tardiness: 'Retardo',
  misconduct: 'Mala Conducta',
  policy_violation: 'Violación de Política',
  safety_violation: 'Violación de Seguridad',
}

export const severityLabels: Record<string, string> = {
  low: 'Leve',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
}

export const incidentStatusLabels: Record<string, string> = {
  open: 'Abierta',
  under_review: 'En Revisión',
  resolved: 'Resuelta',
  dismissed: 'Descartada',
}

export const candidateStatusLabels: Record<string, string> = {
  applied: 'Postulado',
  screening: 'Cribado',
  interview: 'Entrevista',
  assessment: 'Evaluación',
  offered: 'Ofrecido',
  hired: 'Contratado',
  rejected: 'Rechazado',
}

export const vacantStatusLabels: Record<string, string> = {
  open: 'Abierta',
  closed: 'Cerrada',
  filled: 'Cubierta',
  paused: 'Pausada',
}

export const contractTypeLabels: Record<string, string> = {
  individual_work: 'Trabajo Individual',
  power_of_attorney: 'Poder Notarial',
  nda: 'Confidencialidad (NDA)',
  custom: 'Personalizado',
}

export const contractStatusLabels: Record<string, string> = {
  active: 'Vigente',
  expired: 'Expirado',
  terminated: 'Terminado',
  renewed: 'Renovado',
}

export const shiftTypeLabels: Record<string, string> = {
  fixed: 'Fijo',
  rotating: 'Rotativo',
  flexible: 'Flexible',
}
