using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InsureEdge.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CreateProducersGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create "Producers" group for producer self-service login
            // This group is required by ProducerService.CreateLinkedUserAsync
            migrationBuilder.Sql(
                @"INSERT INTO ""group"" (group_code, group_name, group_desc, status, is_department, client_id, group_leader, created_by, created_on)
                SELECT 'PROD01', 'Producers', 'Producer self-service login — quote creation only.', 'Active', false, 1, 1, 1, now()
                WHERE NOT EXISTS (SELECT 1 FROM ""group"" WHERE group_name = 'Producers' AND client_id = 1);");

            // Also create screen permissions for Producers group on New Business Quotes screen
            migrationBuilder.Sql(
                @"INSERT INTO screen_permissions (group_id, screen_id, client_id, is_view_permission, is_create_permission, is_edit_permission, is_duplicate_permission, is_upload_permission, is_download_permission, is_view_sensitive_info, is_access_sensitive_doc, is_approve_reject)
                SELECT g.id, s.id, 1, true, true, false, false, false, false, false, false, false
                FROM ""group"" g
                JOIN app_screen s ON s.screen_code = 'NBQUOTESSCREEN'
                WHERE g.group_name = 'Producers' AND g.client_id = 1
                  AND NOT EXISTS (
                      SELECT 1 FROM screen_permissions sp
                      WHERE sp.group_id = g.id AND sp.screen_id = s.id AND sp.client_id = 1
                  );");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Cleanup would delete the group and its permissions
            migrationBuilder.Sql(
                @"DELETE FROM screen_permissions
                WHERE group_id IN (SELECT id FROM ""group"" WHERE group_name = 'Producers' AND client_id = 1);

                DELETE FROM ""group"" WHERE group_name = 'Producers' AND client_id = 1;");
        }
    }
}
