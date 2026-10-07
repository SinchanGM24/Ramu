import { Module } from "@nestjs/common";
import { ReportPdfService } from "./report-pdf.service";

@Module({ providers: [ReportPdfService], exports: [ReportPdfService] })
export class FilesModule {}
