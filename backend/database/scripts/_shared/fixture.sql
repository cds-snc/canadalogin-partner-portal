-- Stable identities for the two-partner, three-application rehearsal.
-- Do not infer user membership from these relationships: access uses global roles.
CREATE TEMP TABLE _expected_groups (uuid uuid PRIMARY KEY) ON COMMIT DROP;
INSERT INTO _expected_groups VALUES
  ('71000000-0000-4000-8000-000000000001'),
  ('71000000-0000-4000-8000-000000000002');
CREATE TEMP TABLE _expected_applications (
  uuid uuid PRIMARY KEY, partner_group_uuid uuid NOT NULL REFERENCES _expected_groups(uuid)
) ON COMMIT DROP;
INSERT INTO _expected_applications VALUES
  ('72000000-0000-4000-8000-000000000001', '71000000-0000-4000-8000-000000000001'),
  ('72000000-0000-4000-8000-000000000002', '71000000-0000-4000-8000-000000000002'),
  ('72000000-0000-4000-8000-000000000003', '71000000-0000-4000-8000-000000000002');
