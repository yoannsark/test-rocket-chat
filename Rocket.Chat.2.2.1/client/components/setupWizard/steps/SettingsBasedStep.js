import { Input, Field, FieldGroup, Label } from '@rocket.chat/fuselage';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import React, { useEffect, useReducer, useState } from 'react';

import { handleError } from '../../../../app/utils/client';
import { useFocus } from '../../../hooks/useFocus';
import { useTranslation } from '../../contexts/TranslationContext';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { Pager } from '../Pager';
import { useSetupWizardParameters } from '../ParametersProvider';
import { useSetupWizardStepsState } from '../StepsState';
import { Step } from '../Step';
import { StepHeader } from '../StepHeader';
import { StepContent } from '../StepContent';
import { batchSetSettings } from '../functions';

const useFields = () => {
	const reset = 'RESET';
	const setValue = 'SET_VALUE';

	const [fields, dispatch] = useReducer((fields, { type, payload }) => {
		if (type === reset) {
			return payload;
		}

		if (type === setValue) {
			const { _id, value } = payload;
			return fields.map((field) => (field._id === _id ? { ...field, value } : field));
		}

		return fields;
	}, []);

	const resetFields = (fields) => dispatch({ type: reset, payload: fields });
	const setFieldValue = (_id, value) => dispatch({ type: setValue, payload: { _id, value } });

	return { fields, resetFields, setFieldValue };
};

export function SettingsBasedStep({ step, title }) {
	const { settings } = useSetupWizardParameters();
	const { currentStep, goToPreviousStep, goToNextStep } = useSetupWizardStepsState();
	const { fields, resetFields, setFieldValue } = useFields();
	const [commiting, setCommiting] = useState(false);

	const active = step === currentStep;

	const languages = useReactiveValue(() => TAPi18n.getLanguages(), []);

	useEffect(() => {
		resetFields(
			settings
				.filter(({ wizard }) => wizard.step === step)
				.filter(({ type }) => ['string', 'select', 'language'].includes(type))
				.sort(({ wizard: { order: a } }, { wizard: { order: b } }) => a - b)
				.map(({ value, ...field }) => ({ ...field, value: value || '' }))
		);
	}, [settings, currentStep]);

	const t = useTranslation();

	const handleBackClick = () => {
		goToPreviousStep();
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		setCommiting(true);

		try {
			await batchSetSettings(fields.map(({ _id, value }) => ({ _id, value })));
			goToNextStep();
		} catch (error) {
			console.error(error);
			handleError(error);
		} finally {
			setCommiting(false);
		}
	};

	const autoFocusRef = useFocus(active);

	return <Step active={active} working={commiting} onSubmit={handleSubmit}>
		<StepHeader number={step} title={title} />

		<StepContent>
			<FieldGroup>
				{fields.map(({ _id, type, i18nLabel, value, values }, i) =>
					<Field key={i}>
						<Label text={t(i18nLabel)}>
							{type === 'string' && <Input
								type='text'
								name={_id}
								ref={i === 0 ? autoFocusRef : undefined}
								value={value}
								onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
							/>}

							{type === 'select' && <Input
								type='select'
								name={_id}
								placeholder={t('Select_an_option')}
								ref={i === 0 ? autoFocusRef : undefined}
								value={value}
								onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
							>
								{values
									.map(({ i18nLabel, key }) => ({ label: t(i18nLabel), value: key }))
									.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
							</Input>}

							{type === 'language' && <Input
								type='select'
								name={_id}
								placeholder={t('Default')}
								ref={i === 0 ? autoFocusRef : undefined}
								value={value}
								onChange={({ currentTarget: { value } }) => setFieldValue(_id, value)}
							>
								{Object.entries(languages)
									.map(([key, { name }]) => ({ label: name, value: key }))
									.sort((a, b) => a.key - b.key)
									.map(({ label, value }) => <option key={value} value={value}>{label}</option>)}
							</Input>}
						</Label>
					</Field>
				)}
			</FieldGroup>
		</StepContent>

		<Pager
			disabled={commiting}
			onBackClick={currentStep > 2 && handleBackClick}
		/>
	</Step>;
}
