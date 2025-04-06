/** 登录云类型 */
export const enum LoginDeployment {
	/** 公有云登录 */
	PublicDeploymentLogin = "public",
	/** 私有云登录 */
	PrivateDeploymentLogin = "private",
}

export const enum LoginValueKey {
	TYPE = "type",
	PHONE = "phone",
	VERIFICATION_CODE = "code",
	PASSWORD = "password",
	PHONE_STATE_CODE = "state_code",
	DEVICE = "device",
	REDIRECT_URL = "redirect",
	AUTO_REGISTER = "auto_register",
}

export const ServiceAgreementUrl = "/web/terms"
export const PrivacyPolicyUrl = "/web/privacy"
