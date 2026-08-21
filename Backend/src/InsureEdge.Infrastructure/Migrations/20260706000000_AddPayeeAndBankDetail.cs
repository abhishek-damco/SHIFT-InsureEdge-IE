using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations;

public partial class AddPayeeAndBankDetail : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "payee",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                claim_id = table.Column<long>(type: "bigint", nullable: true),
                client_id = table.Column<long>(type: "bigint", nullable: false),
                first_name = table.Column<string>(type: "text", nullable: true),
                middle_name = table.Column<string>(type: "text", nullable: true),
                last_name = table.Column<string>(type: "text", nullable: true),
                business_name = table.Column<string>(type: "text", nullable: true),
                relationship = table.Column<string>(type: "text", nullable: true),
                telephone_number_c_c = table.Column<string>(type: "text", nullable: true),
                telephone_number = table.Column<string>(type: "text", nullable: true),
                email = table.Column<string>(type: "text", nullable: true),
                national_id = table.Column<string>(type: "text", nullable: true),
                social_security_number = table.Column<string>(type: "text", nullable: true),
                tin_id = table.Column<string>(type: "text", nullable: true),
                payee_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                claim_payee_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                payee_code = table.Column<string>(type: "text", nullable: true),
                o_f_a_c_checks = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                bank_details_validation = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                duplicate_payee_check = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                fraud_check = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                certification_verification = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Draft"),
                comments = table.Column<string>(type: "text", nullable: true),
                approved_by = table.Column<long>(type: "bigint", nullable: true),
                approved_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                created_by = table.Column<long>(type: "bigint", nullable: true),
                created_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_by = table.Column<long>(type: "bigint", nullable: true),
                updated_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_payee", x => x.id);
                table.ForeignKey(
                    name: "FK_payee_claim_claim_id",
                    column: x => x.claim_id,
                    principalTable: "claim",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "bank_detail",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                payee_id = table.Column<long>(type: "bigint", nullable: false),
                client_id = table.Column<long>(type: "bigint", nullable: false),
                bank_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                account_holder_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                account_number = table.Column<string>(type: "text", nullable: true),
                account_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                aba_routing_number = table.Column<string>(type: "text", nullable: true),
                paper_cheques_routing_no = table.Column<string>(type: "text", nullable: true),
                business_name = table.Column<string>(type: "text", nullable: true),
                federal_tax_classification = table.Column<string>(type: "text", nullable: true),
                llc_classification = table.Column<string>(type: "text", nullable: true),
                description = table.Column<string>(type: "text", nullable: true),
                ssn = table.Column<string>(type: "text", nullable: true),
                employer_identification_number = table.Column<string>(type: "text", nullable: true),
                type1099 = table.Column<string>(type: "text", nullable: true),
                w9_form_on_file = table.Column<bool>(type: "boolean", nullable: false),
                date_w9_received = table.Column<DateOnly>(type: "date", nullable: true),
                tin = table.Column<string>(type: "text", nullable: true),
                w9_form_irs = table.Column<string>(type: "text", nullable: true),
                reporting_preference = table.Column<string>(type: "text", nullable: true),
                direct_deposit_auth_form = table.Column<string>(type: "text", nullable: true),
                payment_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                auth = table.Column<string>(type: "text", nullable: true),
                adjuster_id = table.Column<long>(type: "bigint", nullable: true),
                rate_per_hour = table.Column<decimal>(type: "numeric", nullable: true),
                created_by = table.Column<long>(type: "bigint", nullable: true),
                created_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_by = table.Column<long>(type: "bigint", nullable: true),
                updated_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_bank_detail", x => x.id);
                table.ForeignKey(
                    name: "FK_bank_detail_payee_payee_id",
                    column: x => x.payee_id,
                    principalTable: "payee",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "ix_payee_claim_id",
            table: "payee",
            column: "claim_id");

        migrationBuilder.CreateIndex(
            name: "ix_payee_client_id",
            table: "payee",
            column: "client_id");

        migrationBuilder.CreateIndex(
            name: "ix_bank_detail_payee_id",
            table: "bank_detail",
            column: "payee_id");

        migrationBuilder.CreateIndex(
            name: "ix_bank_detail_client_id",
            table: "bank_detail",
            column: "client_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "bank_detail");
        migrationBuilder.DropTable(name: "payee");
    }
}
