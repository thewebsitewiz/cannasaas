import { Repository } from 'typeorm';
import { Cart } from '../cart/entities/cart.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { MarketingLog } from './entities/marketing-log.entity';
export declare class CampaignService {
    private cartRepo;
    private userRepo;
    private logRepo;
    private mail;
    private readonly logger;
    constructor(cartRepo: Repository<Cart>, userRepo: Repository<User>, logRepo: Repository<MarketingLog>, mail: MailService);
    processAbandonedCarts(): Promise<void>;
    processWelcomeSeries(): Promise<void>;
    processWinBack(): Promise<void>;
}
