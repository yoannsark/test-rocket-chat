import React from 'react';

import { AdminUserInformationStep } from './steps/AdminUserInformationStep';
import { SettingsBasedStep } from './steps/SettingsBasedStep';
import { RegisterServerStep } from './steps/RegisterServerStep';
import { useTranslation } from '../contexts/TranslationContext';
import { Epilogue } from './Epilogue';
import { SideBar } from './SideBar';
import { useSetupWizardStepsState, finalStep } from './StepsState';

export function Steps() {
	const { currentStep } = useSetupWizardStepsState();
	const t = useTranslation();

	if (currentStep === finalStep) {
		return <Epilogue />;
	}

	return <>
		<SideBar
			steps={[
				{
					step: 1,
					title: t('Admin_Info'),
				},
				{
					step: 2,
					title: t('Organization_Info'),
				},
				{
					step: 3,
					title: t('Server_Info'),
				},
				{
					step: 4,
					title: t('Register_Server'),
				},
			]}
		/>
		<section className='SetupWizard__Steps'>
			<div className='SetupWizard__Steps-wrapper'>
				<AdminUserInformationStep step={1} title={t('Admin_Info')} />
				<SettingsBasedStep step={2} title={t('Organization_Info')} />
				<SettingsBasedStep step={3} title={t('Server_Info')} />
				<RegisterServerStep step={4} title={t('Register_Server')} />
			</div>
		</section>
	</>;
}
