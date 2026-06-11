import { Controller, Get, Param, Header, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ThemeCssService } from './theme-css.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Serves the per-dispensary theme CSS bundle. Public read — themes are
 * baked into every front-end app's first paint, and the data here
 * (palette + font + image URLs) is already visible to anyone browsing
 * the dispensary's storefront. Apps link-inject the response at boot.
 */
@Controller('css')
export class ThemeCssController {
  constructor(private readonly themeCss: ThemeCssService) {}

  @Public()
  @Get('dispensary/:dispensaryId.css')
  @Header('Content-Type', 'text/css; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
  async serve(
    @Param('dispensaryId') dispensaryId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { css, updatedAt } = await this.themeCss.generate(dispensaryId);
    const etag =
      '"' +
      crypto
        .createHash('sha1')
        .update(dispensaryId + ':' + updatedAt.toISOString() + ':' + css.length)
        .digest('hex') +
      '"';
    res.setHeader('ETag', etag);
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }
    res.status(200).send(css);
  }
}
