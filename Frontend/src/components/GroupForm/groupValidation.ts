// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// QA UGM-08/12/13/14/16: User Group Information rules, shared by Add and Edit.
// Mirrors Backend Application/Validation/GroupValidator.cs.
import { required, invalid, isBlank, isValidEmail } from '../../utils/fieldValidation';
import type { GroupInfoValues } from './GroupInformationPanel';

export const GROUP_NAME_MAX = 75;
export const GROUP_EMAIL_MAX = 50;
export const GROUP_DESC_MIN = 5;
export const GROUP_DESC_MAX = 1000;
export const GROUP_DESC_LENGTH_ERROR = 'Group Description should be in between 5 to 1000 characters';

// Letters, digits, space and - & . ' /
const GROUP_NAME_CHARS = /^[A-Za-z0-9 \-&.'/]+$/;

export type GroupInfoErrors = Partial<Record<keyof GroupInfoValues, string>>;

export function validateGroupInfo(v: Pick<GroupInfoValues, 'groupName' | 'groupLeader' | 'groupEmailId' | 'groupDesc'>): GroupInfoErrors {
  const errs: GroupInfoErrors = {};

  const name = v.groupName.trim();
  if (!name) errs.groupName = required('Group Name');
  else if (name.length > GROUP_NAME_MAX || !GROUP_NAME_CHARS.test(name)) errs.groupName = invalid('Group Name');

  if (!v.groupLeader) errs.groupLeader = required('Group Leader');

  const email = v.groupEmailId.trim();
  if (email && !isValidEmail(email)) errs.groupEmailId = invalid('Group Email ID');

  const desc = v.groupDesc.trim();
  if (!isBlank(desc) && (desc.length < GROUP_DESC_MIN || desc.length > GROUP_DESC_MAX))
    errs.groupDesc = GROUP_DESC_LENGTH_ERROR;

  return errs;
}
