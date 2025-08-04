import { useCallback, useState } from "react"
import { Checkbox } from "vscrui"
import { VSCodeTextField } from "@vscode/webview-ui-toolkit/react"

import { type ProviderSettings, type OrganizationAllowList, deepInfraDefaultModelId } from "@roo-code/types"

import type { RouterModels } from "@roo/api"

import { useAppTranslation } from "@src/i18n/TranslationContext"

import { inputEventTransform } from "../transforms"

import { ModelPicker } from "../ModelPicker"

type DeepInfraProps = {
	apiConfiguration: ProviderSettings
	setApiConfigurationField: (field: keyof ProviderSettings, value: ProviderSettings[keyof ProviderSettings]) => void
	routerModels?: RouterModels
	selectedModelId: string
	fromWelcomeView?: boolean
	organizationAllowList: OrganizationAllowList
	modelValidationError?: string
}

export const DeepInfra = ({
	apiConfiguration,
	setApiConfigurationField,
	routerModels,
	fromWelcomeView,
	organizationAllowList,
	modelValidationError,
}: DeepInfraProps) => {
	const { t } = useAppTranslation()

	const [deepInfraBaseUrlSelected, setDeepInfraBaseUrlSelected] = useState(!!apiConfiguration?.deepInfraBaseUrl)

	const handleInputChange = useCallback(
		<K extends keyof ProviderSettings, E>(
			field: K,
			transform: (event: E) => ProviderSettings[K] = inputEventTransform,
		) =>
			(event: E | Event) => {
				setApiConfigurationField(field, transform(event as E))
			},
		[setApiConfigurationField],
	)

	return (
		<>
			<VSCodeTextField
				value={apiConfiguration?.deepInfraApiKey || ""}
				type="password"
				onInput={handleInputChange("deepInfraApiKey")}
				placeholder={t("settings:placeholders.apiKey")}
				className="w-full">
				<label className="block font-medium mb-1">{t("settings:providers.deepInfraApiKey")}</label>
			</VSCodeTextField>
			<div className="text-sm text-vscode-descriptionForeground -mt-2">
				{t("settings:providers.apiKeyStorageNotice")}
			</div>
			{!fromWelcomeView && (
				<div>
					<Checkbox
						checked={deepInfraBaseUrlSelected}
						onChange={(checked: boolean) => {
							setDeepInfraBaseUrlSelected(checked)

							if (!checked) {
								setApiConfigurationField("deepInfraBaseUrl", "")
							}
						}}>
						{t("settings:providers.useCustomBaseUrl")}
					</Checkbox>
					{deepInfraBaseUrlSelected && (
						<VSCodeTextField
							value={apiConfiguration?.deepInfraBaseUrl || ""}
							type="url"
							onInput={handleInputChange("deepInfraBaseUrl")}
							placeholder="Default: https://api.deepinfra.com/v1/openai"
							className="w-full mt-1"
						/>
					)}
				</div>
			)}
			<ModelPicker
				apiConfiguration={apiConfiguration}
				setApiConfigurationField={setApiConfigurationField}
				defaultModelId={deepInfraDefaultModelId}
				models={routerModels?.deepinfra ?? {}}
				modelIdKey="deepInfraModelId"
				serviceName="DeepInfra"
				serviceUrl="https://deepinfra.com/models"
				organizationAllowList={organizationAllowList}
				errorMessage={modelValidationError}
			/>
		</>
	)
}
