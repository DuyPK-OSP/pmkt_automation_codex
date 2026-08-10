export interface InvalidUserData {
  readonly caseName: string;
  readonly username: string;
  readonly password: string;
}

export const invalidUsers: readonly InvalidUserData[] = [
  {
    caseName: 'sai mật khẩu',
    username: 'invalid.user@example.test',
    password: 'InvalidPassword123!',
  },
];
