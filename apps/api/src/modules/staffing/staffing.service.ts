import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { EmployeeCertification } from './entities/employee-certification.entity';
import { PerformanceReview } from './entities/performance-review.entity';
import { LkpPosition, LkpCertificationType } from './entities/staffing-lookups.entity';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol.for('DRIZZLE');

@Injectable()
export class StaffingService {
  private readonly logger = new Logger(StaffingService.name);

  constructor(
    @Inject(DRIZZLE) private db: any
  ) {}

  // ── Employee Roster ───────────────────────────────────────────────────────

  async getEmployees(dispensaryId: string, status?: string): Promise<any[]> {
    const rows = await this._q(
      `SELECT ep.*, u.email, u."firstName", u."lastName", u.role,
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

    return rows.map((r: any) => ({
      profileId: r.profile_id,
      userId: r.user_id,
      dispensaryId: r.dispensary_id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      role: r.role,
      positionId: r.position_id,
      positionName: r.position_name,
      positionCode: r.position_code,
      department: r.position_department ?? r.department,
      employeeNumber: r.employee_number,
      employmentType: r.employment_type,
      employmentStatus: r.employment_status,
      hireDate: r.hire_date,
      terminationDate: r.termination_date,
      hourlyRate: r.hourly_rate ? parseFloat(r.hourly_rate) : null,
      salary: r.salary ? parseFloat(r.salary) : null,
      payType: r.pay_type,
      overtimeEligible: r.overtime_eligible,
      phone: r.phone,
      activeCerts: parseInt(r.active_certs, 10),
      expiringCerts: parseInt(r.expiring_certs, 10),
    }));
  }

  async getEmployee(profileId: string): Promise<any> {
    const employees = await this._q(
      `SELECT ep.*, u.email, u."firstName", u."lastName", u.role,
        lp.name as position_name, lp.code as position_code
       FROM employee_profiles ep
       JOIN users u ON u.id = ep.user_id
       LEFT JOIN lkp_positions lp ON lp.position_id = ep.position_id
       WHERE ep.profile_id = $1`,
      [profileId],
    );
    if (employees.length === 0) throw new NotFoundException('Employee not found');
    const r = employees[0];
    return {
      profileId: r.profile_id, userId: r.user_id, dispensaryId: r.dispensary_id,
      email: r.email, firstName: r.firstName, lastName: r.lastName, role: r.role,
      positionName: r.position_name, positionCode: r.position_code,
      employeeNumber: r.employee_number, department: r.department,
      employmentType: r.employment_type, employmentStatus: r.employment_status,
      hireDate: r.hire_date, terminationDate: r.termination_date,
      hourlyRate: r.hourly_rate ? parseFloat(r.hourly_rate) : null,
      salary: r.salary ? parseFloat(r.salary) : null,
      payType: r.pay_type, overtimeEligible: r.overtime_eligible,
      phone: r.phone,
      emergencyContactName: r.emergency_contact_name,
      emergencyContactPhone: r.emergency_contact_phone,
      emergencyContactRelationship: r.emergency_contact_relationship,
      notes: r.notes,
    };
  }

  async updateEmployee(profileId: string, input: any): Promise<EmployeeProfile> {
    const profile = await this.profileRepo.findOne({ where: { profileId } });
    if (!profile) throw new NotFoundException('Employee not found');

    if (input.positionId !== undefined) profile.position_id = input.positionId;
    if (input.department !== undefined) profile.department = input.department;
    if (input.employmentType !== undefined) profile.employment_type = input.employmentType;
    if (input.employmentStatus !== undefined) profile.employment_status = input.employmentStatus;
    if (input.hourlyRate !== undefined) profile.hourly_rate = input.hourlyRate;
    if (input.salary !== undefined) profile.salary = input.salary;
    if (input.payType !== undefined) profile.pay_type = input.payType;
    if (input.overtimeEligible !== undefined) profile.overtime_eligible = input.overtimeEligible;
    if (input.phone !== undefined) profile.phone = input.phone;
    if (input.emergencyContactName !== undefined) profile.emergency_contact_name = input.emergencyContactName;
    if (input.emergencyContactPhone !== undefined) profile.emergency_contact_phone = input.emergencyContactPhone;
    if (input.notes !== undefined) profile.notes = input.notes;

    if (input.employmentStatus === 'terminated') {
      profile.termination_date = new Date().toISOString().split('T')[0];
      profile.termination_reason = input.terminationReason;
    }

    return this.profileRepo.save(profile);
  }

  // ── Certifications ────────────────────────────────────────────────────────

  async getEmployeeCertifications(profileId: string): Promise<any[]> {
    return this._q(
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

  async verifyCertification(certificationId: string, verifiedByUserId: string): Promise<EmployeeCertification> {
    const cert = await this.certRepo.findOne({ where: { certificationId } });
    if (!cert) throw new NotFoundException('Certification not found');
    cert.status = 'verified';
    cert.verified_by_user_id = verifiedByUserId;
    cert.verified_at = new Date();
    return this.certRepo.save(cert);
  }

  async revokeCertification(certificationId: string, reason?: string): Promise<EmployeeCertification> {
    const cert = await this.certRepo.findOne({ where: { certificationId } });
    if (!cert) throw new NotFoundException('Certification not found');
    cert.status = 'revoked';
    if (reason) cert.notes = (cert.notes ? cert.notes + '\n' : '') + `Revoked: ${reason}`;
    return this.certRepo.save(cert);
  }

  // ── Expiration Alerts ─────────────────────────────────────────────────────

  async getExpiringCertifications(dispensaryId: string, daysAhead = 30): Promise<any[]> {
    return this._q(
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

  async getComplianceOverview(dispensaryId: string): Promise<any> {
    const [result] = await this._q(
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

    return {
      totalEmployees: parseInt(result.total_employees, 10),
      activeEmployees: parseInt(result.active_employees, 10),
      totalCerts: parseInt(result.total_certs, 10),
      activeCerts: parseInt(result.active_certs, 10),
      expiredCerts: parseInt(result.expired_certs, 10),
      expiringSoon: parseInt(result.expiring_soon, 10),
      pendingCerts: parseInt(result.pending_certs, 10),
    };
  }

  // ── Performance Reviews ───────────────────────────────────────────────────

  async getReviews(profileId: string): Promise<PerformanceReview[]> {
    return this.reviewRepo.find({
      where: { profile_id: profileId },
      order: { review_period_end: 'DESC' },
    });
  }

  async createReview(input: any): Promise<PerformanceReview> {
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
    return this.positionRepo.find({ where: { is_active: true }, order: { sort_order: 'ASC' } });
  }

  async getCertificationTypes(): Promise<LkpCertificationType[]> {
    return this.certTypeRepo.find({ where: { is_active: true }, order: { certTypeId: 'ASC' } });
  }

  // ── CRON: Expiration Alerts ───────────────────────────────────────────────

  @Cron('0 8 * * *') // Daily at 8AM
  async checkExpiringCertifications(): Promise<void> {
    this.logger.log('Checking for expiring certifications...');

    const expiring = await this._q(
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
      this.logger.warn(`${expiring.length} certification(s) expiring within 30 days`);
      for (const cert of expiring) {
        this.logger.warn(`  ${cert.firstName} ${cert.lastName} — ${cert.name} expires in ${cert.days_left} days`);
      }
    }

    // Auto-expire past-due certs
    const expired = await this._q(
      `UPDATE employee_certifications SET status = 'expired', updated_at = NOW()
       WHERE status IN ('active', 'verified') AND expiration_date < CURRENT_DATE
       RETURNING certification_id`,
    );

    if (expired.length > 0) {
      this.logger.warn(`Auto-expired ${expired.length} certification(s)`);
    }
  }

  /** Raw SQL helper – bridges TypeORM .query() to Drizzle */
  private async _q(text: string, params?: any[]): Promise<any[]> {
    const client = (this.db as any).session?.client ?? (this.db as any).$client ?? (this.db as any);
    if (client?.query) {
      const r = await client.query(text, params);
      return r.rows ?? r;
    }
    const result = await this.db.execute(sql.raw(text));
    return Array.isArray(result) ? result : (result as any).rows ?? [];
  }

}
