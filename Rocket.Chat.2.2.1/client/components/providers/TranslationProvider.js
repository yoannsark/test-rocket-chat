import React, { useMemo } from 'react';
import { TAPi18n, TAPi18next } from 'meteor/rocketchat:tap-i18n';

import { TranslationContext } from '../contexts/TranslationContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';

const createContextValue = (language) => {
	const translate = (key, ...replaces) => {
		if (typeof replaces[0] === 'object') {
			const [options, lang_tag = language] = replaces;
			return TAPi18next.t(key, {
				ns: 'project',
				lng: lang_tag,
				...options,
			});
		}

		if (replaces.length === 0) {
			return TAPi18next.t(key, { ns: 'project', lng: language });
		}

		return TAPi18next.t(key, {
			postProcess: 'sprintf',
			sprintf: replaces,
			ns: 'project',
			lng: language,
		});
	};

	const has = (key, { lng = language, ...options } = {}) => TAPi18next.exists(key, { ...options, lng });

	translate.has = has;
	return translate;
};

export function TranslationProvider({ children }) {
	const language = useReactiveValue(() => TAPi18n.getLanguage());

	const contextValue = useMemo(() => createContextValue(language), [language]);

	return <TranslationContext.Provider value={contextValue}>
		{children}
	</TranslationContext.Provider>;
}
