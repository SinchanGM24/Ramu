import { Module } from "@nestjs/common";
import { ImageValidationService } from "./image-validation.service";
import { ReportPdfService } from "./report-pdf.service";

@Module({
  providers: [ReportPdfService, ImageValidationService],
  exports: [ReportPdfService, ImageValidationService],
})
export class FilesModule {}
