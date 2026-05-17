import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface AgeVerificationRow {
  verification_id: string;
  dispensary_id: string;
  customer_id: string | null;
  full_name: string;
  date_of_birth: string;
  expiry_date: string;
  id_state: string;
  id_number: string;
  age: number;
  is_21_plus: boolean;
  verification_status: string;
  verified_at: Date | string | null;
  created_at: Date | string;
}

export interface AgeVerificationDto {
  verificationId: string;
  dispensaryId: string;
  customerId?: string;
  fullName: string;
  dateOfBirth: string;
  expiryDate: string;
  idState: string;
  idNumber: string;
  age: number;
  is21Plus: boolean;
  verificationStatus: string;
  verifiedAt?: Date | string;
  createdAt: Date | string;
}

async function rawQuery<T>(
  ds: DataSource,
  sql: string,
  params?: unknown[],
): Promise<T[]> {
  const rows = (await ds.query(sql, params)) as unknown;
  return rows as T[];
}

function mapVerification(row: AgeVerificationRow): AgeVerificationDto {
  return {
    verificationId: row.verification_id,
    dispensaryId: row.dispensary_id,
    customerId: row.customer_id ?? undefined,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth,
    expiryDate: row.expiry_date,
    idState: row.id_state,
    idNumber: row.id_number,
    age: row.age,
    is21Plus: row.is_21_plus,
    verificationStatus: row.verification_status,
    verifiedAt: row.verified_at ?? undefined,
    createdAt: row.created_at,
  };
}

@Injectable()
export class IdVerificationService implements OnModuleInit {
  private readonly logger = new Logger(IdVerificationService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS age_verifications (
        verification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        dispensary_id UUID NOT NULL,
        customer_id UUID,
        full_name VARCHAR(255),
        date_of_birth DATE,
        expiry_date DATE,
        id_state VARCHAR(10),
        id_number VARCHAR(100),
        age INT,
        is_21_plus BOOLEAN,
        verification_status VARCHAR(50) DEFAULT 'pending',
        verified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    this.logger.log('Age verification table initialized');
  }

  async verifyId(input: {
    imageBase64: string;
    dispensaryId: string;
    customerId?: string;
  }): Promise<AgeVerificationDto> {
    // Stub: In production, this would call an OCR API (Jumio, Onfido, etc.)
    void input.imageBase64;
    const stubResult = {
      fullName: 'STUB VERIFICATION',
      dateOfBirth: '1990-01-15',
      expiryDate: '2028-01-15',
      idState: 'CO',
      idNumber: `ID-${Date.now().toString(36).toUpperCase()}`,
    };

    const { age, is21Plus } = this.calculateAge(stubResult.dateOfBirth);

    const saved = await this.saveVerification({
      dispensaryId: input.dispensaryId,
      customerId: input.customerId,
      fullName: stubResult.fullName,
      dateOfBirth: stubResult.dateOfBirth,
      expiryDate: stubResult.expiryDate,
      idState: stubResult.idState,
      idNumber: stubResult.idNumber,
      age,
      is21Plus,
      verificationStatus: is21Plus ? 'verified' : 'rejected_underage',
    });

    this.logger.log(
      `ID verified: dispensary=${input.dispensaryId} age=${String(age)} is21+=${String(is21Plus)}`,
    );

    return saved;
  }

  calculateAge(dob: string): { age: number; is21Plus: boolean } {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return { age, is21Plus: age >= 21 };
  }

  async saveVerification(result: {
    dispensaryId: string;
    customerId?: string;
    fullName: string;
    dateOfBirth: string;
    expiryDate: string;
    idState: string;
    idNumber: string;
    age: number;
    is21Plus: boolean;
    verificationStatus: string;
  }): Promise<AgeVerificationDto> {
    const rows = await rawQuery<AgeVerificationRow>(
      this.dataSource,
      `INSERT INTO age_verifications
        (dispensary_id, customer_id, full_name, date_of_birth, expiry_date, id_state, id_number, age, is_21_plus, verification_status, verified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [
        result.dispensaryId,
        result.customerId ?? null,
        result.fullName,
        result.dateOfBirth,
        result.expiryDate,
        result.idState,
        result.idNumber,
        result.age,
        result.is21Plus,
        result.verificationStatus,
      ],
    );
    return mapVerification(rows[0]);
  }

  async getVerificationHistory(
    customerId: string,
  ): Promise<AgeVerificationDto[]> {
    const rows = await rawQuery<AgeVerificationRow>(
      this.dataSource,
      `SELECT * FROM age_verifications WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId],
    );
    return rows.map(mapVerification);
  }
}
