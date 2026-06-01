type DemoCurrentUser = {
	uuid: string;
	email: string;
	departmentAbbreviation?: string | null;
	isSuperuser?: boolean;
};

const demoCurrentUser: DemoCurrentUser = {
	departmentAbbreviation: "TBS",
	email: "developer@example.com",
	isSuperuser: true,
	uuid: "00000000-0000-0000-0000-000000000001",
};

export const requireAuthenticatedUser = async (_redirectTo: string): Promise<DemoCurrentUser> => demoCurrentUser;

export const requireSuperuser = async (_redirectTo: string): Promise<DemoCurrentUser> => demoCurrentUser;