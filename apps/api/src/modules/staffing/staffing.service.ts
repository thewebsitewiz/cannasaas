import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { EmployeeCertification } from './entities/employee-certification.entity';
import { PerformanceReview } from './entities/performance-review.entity';
import {
  LkpPosition,
  LkpCertificationType,
} from './entities/staffing-lookups.entity';

// ── DB row types ──────────────────────────────────────────────────────────

interface EmployeeListRow {
  profile_id: string;
  user_id: string;
  dispensary_id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  user_is_active: boolean;
  position_id: number | null;
  position_name: string | null;
  position_code: string | null;
  position_department: string | null;
  department: string | null;
  employee_number: string | null;
  employment_type: string;
  employment_status: string;
  hire_date: string | Date | null;
  termination_date: string | Date | null;
  hourly_rate: string | number | null;
  salary: string | number | null;
  pay_type: string;
  overtime_eligible: boolean;
  phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  notes: string | null;
  active_certs: string | number;
  expiring_certs: string | number;
}

interface CertificationRow {
  certification_id: string;
  profile_id: string;
  cert_type_id: number;
  certificate_number: string | null;
  issued_date: string | Date | null;
  expiration_date: string | Date | null;
  document_url: string | null;
  notes: string | null;
  status: string;
  cert_name: string;
  cert_code: string;
  issuing_authority: string | null;
  is_state_required: boolean;
  expiry_status?: 'no_expiry' | 'expired' | 'expiring_soon' | 'valid';
}

interface ExpiringCertRow extends CertificationRow {
  firstName: string;
  lastName: string;
  email: string;
  employee_number: string | null;
  days_until_expiry: number | null;
}

interface ComplianceOverviewRow {
  total_employees: string | number;
  active_employees: string | number;
  total_certs: string | number;
  active_certs: string | number;
  expired_certs: string | number;
  expiring_soon: string | number;
  pending_certs: string | number;
}

interface AutoExpireRow {
  certification_id: string;
}

interface ExpiringCertCronRow {
  certification_id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  expiration_date: string | Date | null;
  days_left: number;
}

// ── Public DTOs ───────────────────────────────────────────────────────────

export interface EmployeeListItem {
  profileId: string;
  userId: string;
  dispensaryId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  positionId?: number;
  positionName?: string;
  positionCode?: string;
  department?: string;
  employeeNumber?: string;
  employmentType: string;
  employmentStatus: string;
  hireDate: string | Date | null;
  terminationDate: string | Date | null;
  hourlyRate: number | null;
  salary: number | null;
  payType: string;
  overtimeEligible: boolean;
  phone?: string;
  activeCerts: number;
  expiringCerts: number;
}

export interface EmployeeDetail {
  profileId: string;
  userId: string;
  dispensaryId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  positionName?: string;
  positionCode?: string;
  employeeNumber?: string;
  department?: string;
  employmentType: string;
  employmentStatus: string;
  hireDate: string | Date | null;
  terminationDate: string | Date | null;
  hourlyRate: number | null;
  salary: number | null;
  payType: string;
  overtimeEligible: boolean;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
}

export interface ComplianceOverview {
  totalEmployees: number;
  activeEmployees: number;
  totalCerts: number;
  activeCerts: number;
  expiredCerts: number;
  expiringSoon: number;
  pendingCerts: number;
}

export interface UpdateEmployeeInput {
  positionId?: number;
  department?: string;
  employmentType?: string;
  employmentStatus?: string;
  hourlyRate?: number;
  salary?: number;
  payType?: string;
  overtimeEligible?: boolean;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  terminationReason?: string;
}

export interface CreateReviewInput {
  profileId: string;
  reviewerUserId: string;
  periodStart: string;
  periodEnd: string;
  overallRating?: number;
  salesRating?: number;
  complianceRating?: number;
  teamworkRating?: number;
  reliabilityRating?: number;
  strengths?: string;
  areasForImprovement?: string;
  goals?: string;
  managerComments?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function toNumber(val: string | number | null | undefined): number | null {
  if (val == null) return null;
  const n = typeof val === 'number' ? val : parseFloat(val);
  return Number.isFinite(n) ? n : null;
}

function toInt(val: string | number | null | undefined): number {
  if (val == null) return 0;
  const n = typeof val === 'number' ? Math.trunc(val) : parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

@Injectable()
export class StaffingService {
  private readonly logger = new Logger(StaffingService.name);

  constructor(
    @InjectRepository(EmployeeProfile)
    private profileRepo: Repository<EmployeeProfile>,
    @InjectRepository(EmployeeCertification)
    private certRepo: Repository<EmployeeCertification>,
    @InjectRepository(PerformanceReview)
    private reviewRepo: Repository<PerformanceReview>,
    @InjectRepository(LkpPosition)
    private positionRepo: Repository<LkpPosition>,
    @InjectRepository(LkpCertificationType)
    private certTypeRepo: Repository<LkpCertificationType>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  // ── Employee Roster ───────────────────────────────────────────────────────

  async getEmployees(
    dispensaryId: string,
    status?: string,
  ): Promise<EmployeeListItem[]> {
    const rows = await rawQuery<EmployeeListRow>(
      this.dataSource,
      `SELECT ep.*, u.email, u."firstName", u."lastName", u.role, u.is_active as user_is_active,
        lp.name as position_name, lp.code as position_code, lp.department as position_department,
        (SELECT COUNT(*) FROM employee_certifications ec WHERE ec.profile_id = ep.profile_id AND ec.status = 'active') as active_certs,
        (SELECT COUNT(*) FROM employee_certifications ec WHERE ec.profile_id = ep.profile_id AND ec.status = 'active' AND ec.expiration_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_certs
       FROM employee_profiles ep
       JOIN users u ON u.id = ep.user_id
       LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
       WHERE ep.dispensary_id = $1 ${status ? 'AND ep.employment_status = $2' : ''}
       ORDER BY lp.sort_order ASC, u."lastName" ASC`,
      status ? [dispensaryId, status] : [dispensaryId],
    );

    return rows.map((r) => ({
      profileId: r.profile_id,
      userId: r.user_id,
      dispensaryId: r.dispensary_id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      role: r.role,
      isActive: r.user_is_active,
      positionId: r.position_id ?? undefined,
      positionName: r.position_name ?? undefined,
      positionCode: r.position_code ?? undefined,
      department: r.position_department ?? r.department ?? undefined,
      employeeNumber: r.employee_number ?? undefined,
      employmentType: r.employment_type,
      employmentStatus: r.employment_status,
      hireDate: r.hire_date,
      terminationDate: r.termination_date,
      hourlyRate: toNumber(r.hourly_rate),
      salary: toNumber(r.salary),
      payType: r.pay_type,
      overtimeEligible: r.overtime_eligible,
      phone: r.phone ?? undefined,
      activeCerts: toInt(r.active_certs),
      expiringCerts: toInt(r.expiring_certs),
    }));
  }

  async getEmployee(profileId: string): Promise<EmployeeDetail> {
    const employees = await rawQuery<EmployeeListRow>(
      this.dataSource,
      `SELECT ep.*, u.email, u."firstName", u."lastName", u.role,
        lp.name as position_name, lp.code as position_code
       FROM employee_profiles ep
       JOIN users u ON u.id = ep.user_id
       LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
       WHERE ep.profile_id = $1`,
      [profileId],
    );
    if (employees.length === 0)
      throw new NotFoundException('Employee not found');
    const r = employees[0];
    return {
      profileId: r.profile_id,
      userId: r.user_id,
      dispensaryId: r.dispensary_id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      role: r.role,
      positionName: r.position_name ?? undefined,
      positionCode: r.position_code ?? undefined,
      employeeNumber: r.employee_number ?? undefined,
      department: r.department ?? undefined,
      employmentType: r.employment_type,
      employmentStatus: r.employment_status,
      hireDate: r.hire_date,
      terminationDate: r.termination_date,
      hourlyRate: toNumber(r.hourly_rate),
      salary: toNumber(r.salary),
      payType: r.pay_type,
      overtimeEligible: r.overtime_eligible,
      phone: r.phone ?? undefined,
      emergencyContactName: r.emergency_contact_name ?? undefined,
      emergencyContactPhone: r.emergency_contact_phone ?? undefined,
      emergencyContactRelationship:
        r.emergency_contact_relationship ?? undefined,
      notes: r.notes ?? undefined,
    };
  }

  async updateEmployee(
    profileId: string,
    input: UpdateEmployeeInput,
  ): Promise<EmployeeProfile> {
    const profile = await this.profileRepo.findOne({ where: { profileId } });
    if (!profile) throw new NotFoundException('Employee not found');

    if (input.positionId !== undefined) profile.position_id = input.positionId;
    if (input.department !== undefined) profile.department = input.department;
    if (input.employmentType !== undefined)
      profile.employment_type = input.employmentType;
    if (input.employmentStatus !== undefined)
      profile.employment_status = input.employmentStatus;
    if (input.hourlyRate !== undefined) profile.hourly_rate = input.hourlyRate;
    if (input.salary !== undefined) profile.salary = input.salary;
    if (input.payType !== undefined) profile.pay_type = input.payType;
    if (input.overtimeEligible !== undefined)
      profile.overtime_eligible = input.overtimeEligible;
    if (input.phone !== undefined) profile.phone = input.phone;
    if (input.emergencyContactName !== undefined)
      profile.emergency_contact_name = input.emergencyContactName;
    if (input.emergencyContactPhone !== undefined)
      profile.emergency_contact_phone = input.emergencyContactPhone;
    if (input.notes !== undefined) profile.notes = input.notes;

    if (input.employmentStatus === 'terminated') {
      profile.termination_date = new Date().toISOString().split('T')[0];
      profile.termination_reason = input.terminationReason;
    }

    return this.profileRepo.save(profile);
  }

  // ── Certifications ────────────────────────────────────────────────────────

  async getEmployeeCertifications(
    profileId: string,
  ): Promise<CertificationRow[]> {
    return rawQuery<CertificationRow>(
      this.dataSource,
      `SELECT ec.*, ct.name as cert_name, ct.code as cert_code, ct.issuing_authority, ct.is_state_required,
        CASE
          WHEN ec.expiration_date IS NULL THEN 'no_expiry'
          WHEN ec.expiration_date <= CURRENT_DATE THEN 'expired'
          WHEN ec.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
          ELSE 'valid'
        END as expiry_status
       FROM employee_certifications ec
       JOIN lkp_certification_types ct ON ct.cert_type_id = ec.cert_type_id
       WHERE ec.profile_id = $1
       ORDER BY ct.sort_order ASC`,
      [profileId],
    );
  }

  async addCertification(input: {
    profileId: string;
    certTypeId: number;
    certificateNumber?: string;
    issuedDate?: string;
    expirationDate?: string;
    documentUrl?: string;
    notes?: string;
  }): Promise<EmployeeCertification> {
    const cert = this.certRepo.create({
      profile_id: input.profileId,
      cert_type_id: input.certTypeId,
      certificate_number: input.certificateNumber,
      issued_date: input.issuedDate,
      expiration_date: input.expirationDate,
      document_url: input.documentUrl,
      notes: input.notes,
      status: 'active',
    });
    return this.certRepo.save(cert);
  }

  async verifyCertification(
    certificationId: string,
    verifiedByUserId: string,
  ): Promise<EmployeeCertification> {
    const cert = await this.certRepo.findOne({ where: { certificationId } });
    if (!cert) throw new NotFoundException('Certification not found');
    cert.status = 'verified';
    cert.verified_by_user_id = verifiedByUserId;
    cert.verified_at = new Date();
    return this.certRepo.save(cert);
  }

  async revokeCertification(
    certificationId: string,
    reason?: string,
  ): Promise<EmployeeCertification> {
    const cert = await this.certRepo.findOne({ where: { certificationId } });
    if (!cert) throw new NotFoundException('Certification not found');
    cert.status = 'revoked';
    if (reason)
      cert.notes = (cert.notes ? cert.notes + '\n' : '') + `Revoked: ${reason}`;
    return this.certRepo.save(cert);
  }

  // ── Expiration Alerts ─────────────────────────────────────────────────────

  async getExpiringCertifications(
    dispensaryId: string,
    daysAhead = 30,
  ): Promise<ExpiringCertRow[]> {
    return rawQuery<ExpiringCertRow>(
      this.dataSource,
      `SELECT ec.*, ct.name as cert_name, ct.code as cert_code, ct.is_state_required,
        u."firstName", u."lastName", u.email,
        ep.employee_number,
        ec.expiration_date - CURRENT_DATE as days_until_expiry
       FROM employee_certifications ec
       JOIN employee_profiles ep ON ep.profile_id = ec.profile_id
       JOIN users u ON u.id = ep.user_id
       JOIN lkp_certification_types ct ON ct.cert_type_id = ec.cert_type_id
       WHERE ep.dispensary_id = $1
         AND ec.status IN ('active', 'verified')
         AND ec.expiration_date IS NOT NULL
         AND ec.expiration_date <= CURRENT_DATE + INTERVAL '1 day' * $2
       ORDER BY ec.expiration_date ASC`,
      [dispensaryId, daysAhead],
    );
  }

  async getComplianceOverview(
    dispensaryId: string,
  ): Promise<ComplianceOverview> {
    const rows = await rawQuery<ComplianceOverviewRow>(
      this.dataSource,
      `SELECT
        COUNT(DISTINCT ep.profile_id) as total_employees,
        COUNT(DISTINCT ep.profile_id) FILTER (WHERE ep.employment_status = 'active') as active_employees,
        COUNT(ec.certification_id) as total_certs,
        COUNT(ec.certification_id) FILTER (WHERE ec.status IN ('active','verified')) as active_certs,
        COUNT(ec.certification_id) FILTER (WHERE ec.status IN ('active','verified') AND ec.expiration_date <= CURRENT_DATE) as expired_certs,
        COUNT(ec.certification_id) FILTER (WHERE ec.status IN ('active','verified') AND ec.expiration_date > CURRENT_DATE AND ec.expiration_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_soon,
        COUNT(ec.certification_id) FILTER (WHERE ec.status = 'pending') as pending_certs
       FROM employee_profiles ep
       LEFT JOIN employee_certifications ec ON ec.profile_id = ep.profile_id
       WHERE ep.dispensary_id = $1`,
      [dispensaryId],
    );
    const result = rows[0];

    return {
      totalEmployees: toInt(result.total_employees),
      activeEmployees: toInt(result.active_employees),
      totalCerts: toInt(result.total_certs),
      activeCerts: toInt(result.active_certs),
      expiredCerts: toInt(result.expired_certs),
      expiringSoon: toInt(result.expiring_soon),
      pendingCerts: toInt(result.pending_certs),
    };
  }

  // ── Performance Reviews ───────────────────────────────────────────────────

  async getReviews(profileId: string): Promise<PerformanceReview[]> {
    return this.reviewRepo.find({
      where: { profile_id: profileId },
      order: { review_period_end: 'DESC' },
    });
  }

  async createReview(input: CreateReviewInput): Promise<PerformanceReview> {
    const review = this.reviewRepo.create({
      profile_id: input.profileId,
      reviewer_user_id: input.reviewerUserId,
      review_period_start: input.periodStart,
      review_period_end: input.periodEnd,
      overall_rating: input.overallRating,
      sales_rating: input.salesRating,
      compliance_rating: input.complianceRating,
      teamwork_rating: input.teamworkRating,
      reliability_rating: input.reliabilityRating,
      strengths: input.strengths,
      areas_for_improvement: input.areasForImprovement,
      goals: input.goals,
      manager_comments: input.managerComments,
      status: 'draft',
    });
    return this.reviewRepo.save(review);
  }

  // ── Lookups ───────────────────────────────────────────────────────────────

  async getPositions(): Promise<LkpPosition[]> {
    return this.positionRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });
  }

  async getCertificationTypes(): Promise<LkpCertificationType[]> {
    return this.certTypeRepo.find({
      where: { is_active: true },
      order: { certTypeId: 'ASC' },
    });
  }

  // ── CRON: Expiration Alerts ───────────────────────────────────────────────

  @Cron('0 8 * * *') // Daily at 8AM
  async checkExpiringCertifications(): Promise<void> {
    this.logger.log('Checking for expiring certifications...');

    const expiring = await rawQuery<ExpiringCertCronRow>(
      this.dataSource,
      `SELECT ec.certification_id, ct.name, u.email, u."firstName", u."lastName",
        ec.expiration_date, ec.expiration_date - CURRENT_DATE as days_left
       FROM employee_certifications ec
       JOIN employee_profiles ep ON ep.profile_id = ec.profile_id
       JOIN users u ON u.id = ep.user_id
       JOIN lkp_certification_types ct ON ct.cert_type_id = ec.cert_type_id
       WHERE ec.status IN ('active', 'verified')
         AND ec.expiration_date IS NOT NULL
         AND ec.expiration_date <= CURRENT_DATE + INTERVAL '30 days'
         AND ec.expiration_date > CURRENT_DATE`,
    );

    if (expiring.length > 0) {
      this.logger.warn(
        `${expiring.length} certification(s) expiring within 30 days`,
      );
      for (const cert of expiring) {
        this.logger.warn(
          `  ${cert.firstName} ${cert.lastName} — ${cert.name} expires in ${cert.days_left} days`,
        );
      }
    }

    // Auto-expire past-due certs
    const expired = await rawQuery<AutoExpireRow>(
      this.dataSource,
      `UPDATE employee_certifications SET status = 'expired', updated_at = NOW()
       WHERE status IN ('active', 'verified') AND expiration_date < CURRENT_DATE
       RETURNING certification_id`,
    );

    if (expired.length > 0) {
      this.logger.warn(`Auto-expired ${expired.length} certification(s)`);
    }
  }
}
