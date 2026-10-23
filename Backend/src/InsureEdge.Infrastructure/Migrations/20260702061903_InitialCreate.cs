using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cause_of_loss",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cause_of_loss", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "claim_initiation_channel",
                columns: table => new
                {
                    id = table.Column<short>(type: "smallint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_claim_initiation_channel", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "client",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    client_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    client_onboarding_date = table.Column<DateOnly>(type: "date", nullable: true),
                    type_of_company = table.Column<string>(type: "text", nullable: true),
                    naic_code = table.Column<string>(type: "text", nullable: true),
                    registered_trade_mark = table.Column<string>(type: "text", nullable: true),
                    client_registration_date = table.Column<DateOnly>(type: "date", nullable: true),
                    domicile_country = table.Column<string>(type: "text", nullable: true),
                    state_of_domicile = table.Column<string>(type: "text", nullable: true),
                    state_allowed_to_operate = table.Column<string>(type: "text", nullable: true),
                    federal_tax_id = table.Column<string>(type: "text", nullable: true),
                    owned_by = table.Column<string>(type: "text", nullable: true),
                    number_of_employees = table.Column<string>(type: "text", nullable: true),
                    est_direct_written_premium = table.Column<string>(type: "text", nullable: true),
                    year_business_started = table.Column<string>(type: "text", nullable: true),
                    business_description = table.Column<string>(type: "text", nullable: true),
                    email_id = table.Column<string>(type: "text", nullable: true),
                    telephone_number = table.Column<string>(type: "text", nullable: true),
                    telephone_number_cc = table.Column<string>(type: "text", nullable: true),
                    extension = table.Column<int>(type: "integer", nullable: true),
                    client_url = table.Column<string>(type: "text", nullable: true),
                    logo_file_name = table.Column<string>(type: "text", nullable: true),
                    logo_content_type = table.Column<string>(type: "text", nullable: true),
                    logo_data = table.Column<byte[]>(type: "bytea", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_client", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "consequence_of_loss",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_consequence_of_loss", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "coverage_type",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_coverage_type", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "impacted_asset",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_impacted_asset", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "insurance_product",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    product_name = table.Column<string>(type: "character varying(75)", maxLength: 75, nullable: false),
                    category = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_insurance_product", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "module",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    module_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_module", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "temp_adjuster",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    user_code = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    middle_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    date_of_birth = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    ssn = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    tax_id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    adjuster_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    claim_types_handled = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    territory_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    territories_assigned = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    preferred_communication = table.Column<string>(type: "text", nullable: true),
                    telephone_number = table.Column<string>(type: "text", nullable: true),
                    extension = table.Column<string>(type: "text", nullable: true),
                    alternative_telephone_number = table.Column<string>(type: "text", nullable: true),
                    email_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    registered_address_line1 = table.Column<string>(type: "text", nullable: true),
                    registered_address_line2 = table.Column<string>(type: "text", nullable: true),
                    registered_country = table.Column<string>(type: "text", nullable: true),
                    registered_state = table.Column<string>(type: "text", nullable: true),
                    registered_city = table.Column<string>(type: "text", nullable: true),
                    registered_county = table.Column<string>(type: "text", nullable: true),
                    registered_zip_code = table.Column<string>(type: "text", nullable: true),
                    registered_latitude = table.Column<string>(type: "text", nullable: true),
                    registered_longitude = table.Column<string>(type: "text", nullable: true),
                    mailing_address_line1 = table.Column<string>(type: "text", nullable: true),
                    mailing_address_line2 = table.Column<string>(type: "text", nullable: true),
                    mailing_country = table.Column<string>(type: "text", nullable: true),
                    mailing_state = table.Column<string>(type: "text", nullable: true),
                    mailing_city = table.Column<string>(type: "text", nullable: true),
                    mailing_county = table.Column<string>(type: "text", nullable: true),
                    mailing_zip_code = table.Column<string>(type: "text", nullable: true),
                    mailing_latitude = table.Column<string>(type: "text", nullable: true),
                    mailing_longitude = table.Column<string>(type: "text", nullable: true),
                    payment_method = table.Column<string>(type: "text", nullable: true),
                    rate_per_hour = table.Column<string>(type: "text", nullable: true),
                    compliance_flag = table.Column<string>(type: "text", nullable: true),
                    access_json = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_temp_adjuster", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "user",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "client_address",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    address_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    address_line1 = table.Column<string>(type: "text", nullable: true),
                    address_line2 = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    county = table.Column<string>(type: "text", nullable: true),
                    zip_code = table.Column<string>(type: "text", nullable: true),
                    latitude = table.Column<string>(type: "text", nullable: true),
                    longitude = table.Column<string>(type: "text", nullable: true),
                    is_manual = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_client_address", x => x.id);
                    table.ForeignKey(
                        name: "fk_client_address_client_client_id",
                        column: x => x.client_id,
                        principalTable: "client",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "client_company",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    company_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    company_name = table.Column<string>(type: "character varying(75)", maxLength: 75, nullable: false),
                    status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    domicile_country = table.Column<string>(type: "text", nullable: true),
                    state_of_domicile = table.Column<string>(type: "text", nullable: true),
                    naic_code = table.Column<string>(type: "text", nullable: true),
                    email_id = table.Column<string>(type: "text", nullable: true),
                    telephone_number = table.Column<string>(type: "text", nullable: true),
                    telephone_number_cc = table.Column<string>(type: "text", nullable: true),
                    extension = table.Column<int>(type: "integer", nullable: true),
                    federal_tax_id = table.Column<string>(type: "text", nullable: true),
                    url = table.Column<string>(type: "text", nullable: true),
                    business_description = table.Column<string>(type: "text", nullable: true),
                    logo_file_name = table.Column<string>(type: "text", nullable: true),
                    logo_content_type = table.Column<string>(type: "text", nullable: true),
                    logo_data = table.Column<byte[]>(type: "bytea", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_client_company", x => x.id);
                    table.ForeignKey(
                        name: "fk_client_company_client_client_id",
                        column: x => x.client_id,
                        principalTable: "client",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "client_contact",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    contact_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "text", nullable: true),
                    suffix = table.Column<string>(type: "text", nullable: true),
                    title = table.Column<string>(type: "text", nullable: true),
                    email_id = table.Column<string>(type: "text", nullable: true),
                    telephone_number = table.Column<string>(type: "text", nullable: true),
                    telephone_number_cc = table.Column<string>(type: "text", nullable: true),
                    extension = table.Column<int>(type: "integer", nullable: true),
                    alt_telephone_number = table.Column<string>(type: "text", nullable: true),
                    alt_telephone_number_cc = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_client_contact", x => x.id);
                    table.ForeignKey(
                        name: "fk_client_contact_client_client_id",
                        column: x => x.client_id,
                        principalTable: "client",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "client_office",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    office_name = table.Column<string>(type: "character varying(75)", maxLength: 75, nullable: false),
                    office_type = table.Column<string>(type: "text", nullable: true),
                    address_line1 = table.Column<string>(type: "text", nullable: true),
                    address_line2 = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    county = table.Column<string>(type: "text", nullable: true),
                    zip_code = table.Column<string>(type: "text", nullable: true),
                    latitude = table.Column<string>(type: "text", nullable: true),
                    longitude = table.Column<string>(type: "text", nullable: true),
                    contact_name = table.Column<string>(type: "text", nullable: true),
                    contact_suffix = table.Column<string>(type: "text", nullable: true),
                    contact_title = table.Column<string>(type: "text", nullable: true),
                    contact_email = table.Column<string>(type: "text", nullable: true),
                    contact_phone = table.Column<string>(type: "text", nullable: true),
                    contact_phone_cc = table.Column<string>(type: "text", nullable: true),
                    contact_ext = table.Column<int>(type: "integer", nullable: true),
                    contact_alt_phone = table.Column<string>(type: "text", nullable: true),
                    contact_alt_phone_cc = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_client_office", x => x.id);
                    table.ForeignKey(
                        name: "fk_client_office_client_client_id",
                        column: x => x.client_id,
                        principalTable: "client",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "group",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    group_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    group_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    group_email_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    group_leader = table.Column<long>(type: "bigint", nullable: false),
                    group_desc = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    is_department = table.Column<bool>(type: "boolean", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_group", x => x.id);
                    table.ForeignKey(
                        name: "fk_group_clients_client_id",
                        column: x => x.client_id,
                        principalTable: "client",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "policy",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    policy_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    insured_name = table.Column<string>(type: "text", nullable: true),
                    address = table.Column<string>(type: "text", nullable: true),
                    effective_date = table.Column<DateOnly>(type: "date", nullable: true),
                    lob = table.Column<string>(type: "text", nullable: true),
                    sub_product = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_policy", x => x.id);
                    table.ForeignKey(
                        name: "fk_policy_client_client_id",
                        column: x => x.client_id,
                        principalTable: "client",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "insurance_sub_product",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    product_id = table.Column<long>(type: "bigint", nullable: false),
                    sub_product_name = table.Column<string>(type: "character varying(75)", maxLength: 75, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_insurance_sub_product", x => x.id);
                    table.ForeignKey(
                        name: "fk_insurance_sub_product_insurance_product_product_id",
                        column: x => x.product_id,
                        principalTable: "insurance_product",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "app_screen",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    screen_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    screen_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    module_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_app_screen", x => x.id);
                    table.ForeignKey(
                        name: "fk_app_screen_modules_module_id",
                        column: x => x.module_id,
                        principalTable: "module",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "temp_adjuster_license",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    adjuster_id = table.Column<long>(type: "bigint", nullable: false),
                    licensed_state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    license_number = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    license_start_date = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    license_expiration_date = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_temp_adjuster_license", x => x.id);
                    table.ForeignKey(
                        name: "fk_temp_adjuster_license_temp_adjuster_adjuster_id",
                        column: x => x.adjuster_id,
                        principalTable: "temp_adjuster",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "claim_worksheet",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    ws_number = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    close_manually = table.Column<bool>(type: "boolean", nullable: false),
                    comments = table.Column<string>(type: "text", nullable: true),
                    approved_by = table.Column<long>(type: "bigint", nullable: true),
                    escalated_to = table.Column<long>(type: "bigint", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_claim_worksheet", x => x.id);
                    table.ForeignKey(
                        name: "fk_claim_worksheet_user_approved_by",
                        column: x => x.approved_by,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_claim_worksheet_user_created_by",
                        column: x => x.created_by,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_claim_worksheet_user_escalated_to",
                        column: x => x.escalated_to,
                        principalTable: "user",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_claim_worksheet_user_updated_by",
                        column: x => x.updated_by,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "user_password_reset",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    username = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    code_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    is_onboarding = table.Column<bool>(type: "boolean", nullable: false),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_user_password_reset", x => x.id);
                    table.ForeignKey(
                        name: "fk_user_password_reset_user_user_id",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_address",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_id = table.Column<long>(type: "bigint", nullable: false),
                    address_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    address_line1 = table.Column<string>(type: "text", nullable: true),
                    address_line2 = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    county = table.Column<string>(type: "text", nullable: true),
                    zip_code = table.Column<string>(type: "text", nullable: true),
                    latitude = table.Column<string>(type: "text", nullable: true),
                    longitude = table.Column<string>(type: "text", nullable: true),
                    is_manual = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_company_address", x => x.id);
                    table.ForeignKey(
                        name: "fk_company_address_client_company_company_id",
                        column: x => x.company_id,
                        principalTable: "client_company",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_contact",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_id = table.Column<long>(type: "bigint", nullable: false),
                    contact_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "text", nullable: true),
                    suffix = table.Column<string>(type: "text", nullable: true),
                    title = table.Column<string>(type: "text", nullable: true),
                    email_id = table.Column<string>(type: "text", nullable: true),
                    telephone_number = table.Column<string>(type: "text", nullable: true),
                    telephone_number_cc = table.Column<string>(type: "text", nullable: true),
                    extension = table.Column<int>(type: "integer", nullable: true),
                    alt_telephone_number = table.Column<string>(type: "text", nullable: true),
                    alt_telephone_number_cc = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_company_contact", x => x.id);
                    table.ForeignKey(
                        name: "fk_company_contact_client_company_company_id",
                        column: x => x.company_id,
                        principalTable: "client_company",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_product_access",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    company_id = table.Column<long>(type: "bigint", nullable: false),
                    product_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_company_product_access", x => x.id);
                    table.ForeignKey(
                        name: "fk_company_product_access_client_company_company_id",
                        column: x => x.company_id,
                        principalTable: "client_company",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_company_product_access_insurance_products_product_id",
                        column: x => x.product_id,
                        principalTable: "insurance_product",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "group_user",
                columns: table => new
                {
                    group_id = table.Column<long>(type: "bigint", nullable: false),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_group_user", x => new { x.group_id, x.user_id });
                    table.ForeignKey(
                        name: "fk_group_user_group_group_id",
                        column: x => x.group_id,
                        principalTable: "group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_group_user_users_user_id",
                        column: x => x.user_id,
                        principalTable: "user",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "claim",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    policy_id = table.Column<long>(type: "bigint", nullable: false),
                    risk_location_id = table.Column<long>(type: "bigint", nullable: true),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    last_step_number = table.Column<short>(type: "smallint", nullable: false),
                    is_claim_reported_by_insured = table.Column<bool>(type: "boolean", nullable: false),
                    reporter_first_name = table.Column<string>(type: "text", nullable: true),
                    reporter_last_name = table.Column<string>(type: "text", nullable: true),
                    reporter_relationship = table.Column<string>(type: "text", nullable: true),
                    reporter_telephone = table.Column<string>(type: "text", nullable: true),
                    reporter_telephone_cc = table.Column<string>(type: "text", nullable: true),
                    reporter_email = table.Column<string>(type: "text", nullable: true),
                    date_of_loss = table.Column<DateOnly>(type: "date", nullable: true),
                    time_of_loss = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    claim_initiation_channel = table.Column<string>(type: "text", nullable: true),
                    claim_type = table.Column<string>(type: "text", nullable: true),
                    main_cause_of_loss = table.Column<string>(type: "text", nullable: true),
                    consequences_of_loss = table.Column<string>(type: "text", nullable: true),
                    inspection_required = table.Column<bool>(type: "boolean", nullable: false),
                    claim_reimbursement_type = table.Column<string>(type: "text", nullable: true),
                    catastrophic_event = table.Column<string>(type: "text", nullable: true),
                    loss_description = table.Column<string>(type: "text", nullable: true),
                    list_of_damage_first_party = table.Column<string>(type: "text", nullable: true),
                    physical_damage = table.Column<bool>(type: "boolean", nullable: true),
                    claim_only_third_party = table.Column<bool>(type: "boolean", nullable: true),
                    is_third_party_damage = table.Column<bool>(type: "boolean", nullable: false),
                    loss_address_line1 = table.Column<string>(type: "text", nullable: true),
                    loss_address_line2 = table.Column<string>(type: "text", nullable: true),
                    loss_country = table.Column<string>(type: "text", nullable: true),
                    loss_state = table.Column<string>(type: "text", nullable: true),
                    loss_city = table.Column<string>(type: "text", nullable: true),
                    loss_county = table.Column<string>(type: "text", nullable: true),
                    loss_zip_code = table.Column<string>(type: "text", nullable: true),
                    loss_latitude = table.Column<string>(type: "text", nullable: true),
                    loss_longitude = table.Column<string>(type: "text", nullable: true),
                    claim_estimate = table.Column<string>(type: "text", nullable: true),
                    comment = table.Column<string>(type: "text", nullable: true),
                    claim_closure_date = table.Column<DateOnly>(type: "date", nullable: true),
                    assigned_to = table.Column<long>(type: "bigint", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_claim", x => x.id);
                    table.ForeignKey(
                        name: "fk_claim_policy_policy_id",
                        column: x => x.policy_id,
                        principalTable: "policy",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_claim_user_assigned_to",
                        column: x => x.assigned_to,
                        principalTable: "user",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "insured",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    policy_id = table.Column<long>(type: "bigint", nullable: false),
                    customer_id = table.Column<string>(type: "text", nullable: true),
                    first_name = table.Column<string>(type: "text", nullable: true),
                    last_name = table.Column<string>(type: "text", nullable: true),
                    address_line1 = table.Column<string>(type: "text", nullable: true),
                    address_line2 = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    county = table.Column<string>(type: "text", nullable: true),
                    zip_code = table.Column<string>(type: "text", nullable: true),
                    telephone = table.Column<string>(type: "text", nullable: true),
                    telephone_ext = table.Column<string>(type: "text", nullable: true),
                    alternate_telephone = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    client_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_insured", x => x.id);
                    table.ForeignKey(
                        name: "fk_insured_policy_policy_id",
                        column: x => x.policy_id,
                        principalTable: "policy",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "risk_location",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    policy_id = table.Column<long>(type: "bigint", nullable: false),
                    property_location = table.Column<string>(type: "text", nullable: true),
                    latitude = table.Column<string>(type: "text", nullable: true),
                    longitude = table.Column<string>(type: "text", nullable: true),
                    occupancy_type = table.Column<string>(type: "text", nullable: true),
                    construction_type = table.Column<string>(type: "text", nullable: true),
                    age_of_property = table.Column<string>(type: "text", nullable: true),
                    length_of_occupancy = table.Column<string>(type: "text", nullable: true),
                    roof_type = table.Column<string>(type: "text", nullable: true),
                    fire_protection_class = table.Column<string>(type: "text", nullable: true),
                    client_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_risk_location", x => x.id);
                    table.ForeignKey(
                        name: "fk_risk_location_policy_policy_id",
                        column: x => x.policy_id,
                        principalTable: "policy",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "screen_permissions",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    group_id = table.Column<long>(type: "bigint", nullable: false),
                    screen_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    is_view_permission = table.Column<bool>(type: "boolean", nullable: false),
                    is_create_permission = table.Column<bool>(type: "boolean", nullable: false),
                    is_edit_permission = table.Column<bool>(type: "boolean", nullable: false),
                    is_duplicate_permission = table.Column<bool>(type: "boolean", nullable: false),
                    is_upload_permission = table.Column<bool>(type: "boolean", nullable: false),
                    is_download_permission = table.Column<bool>(type: "boolean", nullable: false),
                    is_view_sensitive_info = table.Column<bool>(type: "boolean", nullable: false),
                    is_access_sensitive_doc = table.Column<bool>(type: "boolean", nullable: false),
                    is_approve_reject = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_screen_permissions", x => x.id);
                    table.ForeignKey(
                        name: "fk_screen_permissions_app_screens_screen_id",
                        column: x => x.screen_id,
                        principalTable: "app_screen",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_screen_permissions_groups_group_id",
                        column: x => x.group_id,
                        principalTable: "group",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "worksheet_payment",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    worksheet_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    coverage = table.Column<string>(type: "text", nullable: true),
                    cause_of_loss_description = table.Column<string>(type: "text", nullable: true),
                    payee_type = table.Column<string>(type: "text", nullable: true),
                    payee_name = table.Column<string>(type: "text", nullable: true),
                    liability_claim = table.Column<string>(type: "text", nullable: true),
                    payment_amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_worksheet_payment", x => x.id);
                    table.ForeignKey(
                        name: "fk_worksheet_payment_claim_worksheet_worksheet_id",
                        column: x => x.worksheet_id,
                        principalTable: "claim_worksheet",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "worksheet_reserve",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    worksheet_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    coverage = table.Column<string>(type: "text", nullable: true),
                    coverage_limit = table.Column<decimal>(type: "numeric", nullable: true),
                    cause_of_loss_description = table.Column<string>(type: "text", nullable: true),
                    cause_of_loss_code = table.Column<string>(type: "text", nullable: true),
                    cause_of_loss_limit = table.Column<decimal>(type: "numeric", nullable: true),
                    liability_claim_description = table.Column<string>(type: "text", nullable: true),
                    liability_claim_code = table.Column<string>(type: "text", nullable: true),
                    liability_limit = table.Column<decimal>(type: "numeric", nullable: true),
                    superseding_limit = table.Column<decimal>(type: "numeric", nullable: true),
                    reserve_amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_worksheet_reserve", x => x.id);
                    table.ForeignKey(
                        name: "fk_worksheet_reserve_claim_worksheet_worksheet_id",
                        column: x => x.worksheet_id,
                        principalTable: "claim_worksheet",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_product_jurisdiction",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    access_id = table.Column<long>(type: "bigint", nullable: false),
                    state_code = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    state_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_company_product_jurisdiction", x => x.id);
                    table.ForeignKey(
                        name: "fk_company_product_jurisdiction_company_product_access_access_",
                        column: x => x.access_id,
                        principalTable: "company_product_access",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "company_product_sub_product",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    access_id = table.Column<long>(type: "bigint", nullable: false),
                    sub_product_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_company_product_sub_product", x => x.id);
                    table.ForeignKey(
                        name: "fk_company_product_sub_product_company_product_access_access_id",
                        column: x => x.access_id,
                        principalTable: "company_product_access",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_company_product_sub_product_insurance_sub_product_sub_produ",
                        column: x => x.sub_product_id,
                        principalTable: "insurance_sub_product",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "claim_coverage",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_id = table.Column<long>(type: "bigint", nullable: false),
                    coverage = table.Column<string>(type: "text", nullable: true),
                    cause_of_loss = table.Column<string>(type: "text", nullable: true),
                    client_id = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_claim_coverage", x => x.id);
                    table.ForeignKey(
                        name: "fk_claim_coverage_claim_claim_id",
                        column: x => x.claim_id,
                        principalTable: "claim",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "claim_document",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    content_type = table.Column<string>(type: "text", nullable: true),
                    file_size = table.Column<long>(type: "bigint", nullable: true),
                    document_file = table.Column<byte[]>(type: "bytea", nullable: true),
                    notify_to = table.Column<long>(type: "bigint", nullable: true),
                    comment = table.Column<string>(type: "text", nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_claim_document", x => x.id);
                    table.ForeignKey(
                        name: "fk_claim_document_claim_claim_id",
                        column: x => x.claim_id,
                        principalTable: "claim",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "claimant",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    party_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    first_name = table.Column<string>(type: "text", nullable: true),
                    middle_name = table.Column<string>(type: "text", nullable: true),
                    last_name = table.Column<string>(type: "text", nullable: true),
                    relationship_with_insured = table.Column<string>(type: "text", nullable: true),
                    telephone = table.Column<string>(type: "text", nullable: true),
                    telephone_cc = table.Column<string>(type: "text", nullable: true),
                    alternate_telephone = table.Column<string>(type: "text", nullable: true),
                    email = table.Column<string>(type: "text", nullable: true),
                    address_line1 = table.Column<string>(type: "text", nullable: true),
                    address_line2 = table.Column<string>(type: "text", nullable: true),
                    country = table.Column<string>(type: "text", nullable: true),
                    state = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    county = table.Column<string>(type: "text", nullable: true),
                    zip_code = table.Column<string>(type: "text", nullable: true),
                    latitude = table.Column<string>(type: "text", nullable: true),
                    longitude = table.Column<string>(type: "text", nullable: true),
                    list_of_damages = table.Column<string>(type: "text", nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_claimant", x => x.id);
                    table.ForeignKey(
                        name: "fk_claimant_claim_claim_id",
                        column: x => x.claim_id,
                        principalTable: "claim",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "temp_claim_party",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    party_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    party_category = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    business_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    tin_id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    middle_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    date_of_birth = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    gender = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    social_security_number = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    relationship_with_insured = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    address_line1 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    address_line2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    county = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    zip_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    latitude = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    longitude = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    telephone_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    extension = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    alternate_telephone_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    email_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    profile_image_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    id_proof_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_temp_claim_party", x => x.id);
                    table.ForeignKey(
                        name: "fk_temp_claim_party_claim_claim_id",
                        column: x => x.claim_id,
                        principalTable: "claim",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "temp_claim_report",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    report_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    report_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    report_filing_date = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    precinct_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    case_status = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    number_of_witness = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    notify_document_upload = table.Column<bool>(type: "boolean", nullable: false),
                    notify_to_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    comment = table.Column<string>(type: "text", nullable: true),
                    contact_first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    contact_last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    identity_document = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    telephone_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    extension = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    alternate_telephone_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    email_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    reference_document_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_temp_claim_report", x => x.id);
                    table.ForeignKey(
                        name: "fk_temp_claim_report_claim_claim_id",
                        column: x => x.claim_id,
                        principalTable: "claim",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "temp_claim_witness",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<long>(type: "bigint", nullable: false),
                    first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    middle_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    date_of_birth = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    gender = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    social_security_number = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    relationship_with_insured = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    address_line1 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    address_line2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    county = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    zip_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    latitude = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    longitude = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    telephone_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    extension = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    alternate_telephone_number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    email_id = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    profile_image_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    id_proof_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    created_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_on = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_temp_claim_witness", x => x.id);
                    table.ForeignKey(
                        name: "fk_temp_claim_witness_claim_claim_id",
                        column: x => x.claim_id,
                        principalTable: "claim",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "claim_coverage_asset",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    claim_coverage_id = table.Column<long>(type: "bigint", nullable: false),
                    asset_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_claim_coverage_asset", x => x.id);
                    table.ForeignKey(
                        name: "fk_claim_coverage_asset_claim_coverage_claim_coverage_id",
                        column: x => x.claim_coverage_id,
                        principalTable: "claim_coverage",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_app_screen_module_id",
                table: "app_screen",
                column: "module_id");

            migrationBuilder.CreateIndex(
                name: "ix_cause_of_loss_name",
                table: "cause_of_loss",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_claim_assigned_to",
                table: "claim",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "ix_claim_policy_id",
                table: "claim",
                column: "policy_id");

            migrationBuilder.CreateIndex(
                name: "ix_claim_coverage_claim_id",
                table: "claim_coverage",
                column: "claim_id");

            migrationBuilder.CreateIndex(
                name: "ix_claim_coverage_asset_claim_coverage_id",
                table: "claim_coverage_asset",
                column: "claim_coverage_id");

            migrationBuilder.CreateIndex(
                name: "ix_claim_document_claim_id",
                table: "claim_document",
                column: "claim_id");

            migrationBuilder.CreateIndex(
                name: "ix_claim_initiation_channel_name",
                table: "claim_initiation_channel",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_claim_worksheet_approved_by",
                table: "claim_worksheet",
                column: "approved_by");

            migrationBuilder.CreateIndex(
                name: "ix_claim_worksheet_created_by",
                table: "claim_worksheet",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "ix_claim_worksheet_escalated_to",
                table: "claim_worksheet",
                column: "escalated_to");

            migrationBuilder.CreateIndex(
                name: "ix_claim_worksheet_updated_by",
                table: "claim_worksheet",
                column: "updated_by");

            migrationBuilder.CreateIndex(
                name: "ix_claimant_claim_id",
                table: "claimant",
                column: "claim_id");

            migrationBuilder.CreateIndex(
                name: "ix_client_address_client_id_address_type",
                table: "client_address",
                columns: new[] { "client_id", "address_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_client_company_client_id_company_code",
                table: "client_company",
                columns: new[] { "client_id", "company_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_client_contact_client_id_contact_type",
                table: "client_contact",
                columns: new[] { "client_id", "contact_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_client_office_client_id",
                table: "client_office",
                column: "client_id");

            migrationBuilder.CreateIndex(
                name: "ix_company_address_company_id_address_type",
                table: "company_address",
                columns: new[] { "company_id", "address_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_company_contact_company_id_contact_type",
                table: "company_contact",
                columns: new[] { "company_id", "contact_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_company_product_access_company_id_product_id",
                table: "company_product_access",
                columns: new[] { "company_id", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_company_product_access_product_id",
                table: "company_product_access",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_company_product_jurisdiction_access_id_state_code",
                table: "company_product_jurisdiction",
                columns: new[] { "access_id", "state_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_company_product_sub_product_access_id_sub_product_id",
                table: "company_product_sub_product",
                columns: new[] { "access_id", "sub_product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_company_product_sub_product_sub_product_id",
                table: "company_product_sub_product",
                column: "sub_product_id");

            migrationBuilder.CreateIndex(
                name: "ix_consequence_of_loss_name",
                table: "consequence_of_loss",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_group_client_id",
                table: "group",
                column: "client_id");

            migrationBuilder.CreateIndex(
                name: "ix_group_user_group_id_user_id",
                table: "group_user",
                columns: new[] { "group_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_group_user_user_id",
                table: "group_user",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_impacted_asset_name",
                table: "impacted_asset",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_insurance_product_product_name_category",
                table: "insurance_product",
                columns: new[] { "product_name", "category" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_insurance_sub_product_product_id",
                table: "insurance_sub_product",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "ix_insured_policy_id",
                table: "insured",
                column: "policy_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_policy_client_id",
                table: "policy",
                column: "client_id");

            migrationBuilder.CreateIndex(
                name: "ix_policy_policy_number_client_id",
                table: "policy",
                columns: new[] { "policy_number", "client_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_risk_location_policy_id",
                table: "risk_location",
                column: "policy_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_screen_permissions_group_id_screen_id_client_id",
                table: "screen_permissions",
                columns: new[] { "group_id", "screen_id", "client_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_screen_permissions_screen_id",
                table: "screen_permissions",
                column: "screen_id");

            migrationBuilder.CreateIndex(
                name: "ix_temp_adjuster_client_id_user_code",
                table: "temp_adjuster",
                columns: new[] { "client_id", "user_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_temp_adjuster_license_adjuster_id",
                table: "temp_adjuster_license",
                column: "adjuster_id");

            migrationBuilder.CreateIndex(
                name: "ix_temp_claim_party_claim_id_client_id",
                table: "temp_claim_party",
                columns: new[] { "claim_id", "client_id" });

            migrationBuilder.CreateIndex(
                name: "ix_temp_claim_report_claim_id_client_id",
                table: "temp_claim_report",
                columns: new[] { "claim_id", "client_id" });

            migrationBuilder.CreateIndex(
                name: "ix_temp_claim_witness_claim_id_client_id",
                table: "temp_claim_witness",
                columns: new[] { "claim_id", "client_id" });

            migrationBuilder.CreateIndex(
                name: "ix_user_email_client_id",
                table: "user",
                columns: new[] { "email", "client_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_user_password_reset_user_id",
                table: "user_password_reset",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_worksheet_payment_worksheet_id",
                table: "worksheet_payment",
                column: "worksheet_id");

            migrationBuilder.CreateIndex(
                name: "ix_worksheet_reserve_worksheet_id",
                table: "worksheet_reserve",
                column: "worksheet_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cause_of_loss");

            migrationBuilder.DropTable(
                name: "claim_coverage_asset");

            migrationBuilder.DropTable(
                name: "claim_document");

            migrationBuilder.DropTable(
                name: "claim_initiation_channel");

            migrationBuilder.DropTable(
                name: "claimant");

            migrationBuilder.DropTable(
                name: "client_address");

            migrationBuilder.DropTable(
                name: "client_contact");

            migrationBuilder.DropTable(
                name: "client_office");

            migrationBuilder.DropTable(
                name: "company_address");

            migrationBuilder.DropTable(
                name: "company_contact");

            migrationBuilder.DropTable(
                name: "company_product_jurisdiction");

            migrationBuilder.DropTable(
                name: "company_product_sub_product");

            migrationBuilder.DropTable(
                name: "consequence_of_loss");

            migrationBuilder.DropTable(
                name: "coverage_type");

            migrationBuilder.DropTable(
                name: "group_user");

            migrationBuilder.DropTable(
                name: "impacted_asset");

            migrationBuilder.DropTable(
                name: "insured");

            migrationBuilder.DropTable(
                name: "risk_location");

            migrationBuilder.DropTable(
                name: "screen_permissions");

            migrationBuilder.DropTable(
                name: "temp_adjuster_license");

            migrationBuilder.DropTable(
                name: "temp_claim_party");

            migrationBuilder.DropTable(
                name: "temp_claim_report");

            migrationBuilder.DropTable(
                name: "temp_claim_witness");

            migrationBuilder.DropTable(
                name: "user_password_reset");

            migrationBuilder.DropTable(
                name: "worksheet_payment");

            migrationBuilder.DropTable(
                name: "worksheet_reserve");

            migrationBuilder.DropTable(
                name: "claim_coverage");

            migrationBuilder.DropTable(
                name: "company_product_access");

            migrationBuilder.DropTable(
                name: "insurance_sub_product");

            migrationBuilder.DropTable(
                name: "app_screen");

            migrationBuilder.DropTable(
                name: "group");

            migrationBuilder.DropTable(
                name: "temp_adjuster");

            migrationBuilder.DropTable(
                name: "claim_worksheet");

            migrationBuilder.DropTable(
                name: "claim");

            migrationBuilder.DropTable(
                name: "client_company");

            migrationBuilder.DropTable(
                name: "insurance_product");

            migrationBuilder.DropTable(
                name: "module");

            migrationBuilder.DropTable(
                name: "policy");

            migrationBuilder.DropTable(
                name: "user");

            migrationBuilder.DropTable(
                name: "client");
        }
    }
}
