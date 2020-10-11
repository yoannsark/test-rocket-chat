import { Icon } from '@rocket.chat/fuselage';
import React, { useEffect, useRef, useState } from 'react';

import { useConnectionStatus, useReconnect } from '../contexts/ConnectionStatusContext';
import { useTranslation } from '../contexts/TranslationContext';
import './ConnectionStatusAlert.css';

export function ConnectionStatusAlert() {
	const {
		connected,
		retryTime,
		status,
	} = useConnectionStatus();
	const reconnect = useReconnect();
	const reconnectionTimerRef = useRef();
	const [reconnectCountdown, setReconnectCountdown] = useState(0);
	const t = useTranslation();

	useEffect(() => {
		if (status === 'waiting') {
			if (reconnectionTimerRef.current) {
				return;
			}

			reconnectionTimerRef.current = setInterval(() => {
				const timeDiff = retryTime - Date.now();
				setReconnectCountdown((timeDiff > 0 && Math.round(timeDiff / 1000)) || 0);
			}, 500);
			return;
		}

		clearInterval(reconnectionTimerRef.current);
		reconnectionTimerRef.current = null;
	}, [retryTime, status]);

	useEffect(() => () => {
		clearInterval(reconnectionTimerRef.current);
	}, []);

	if (connected) {
		return null;
	}

	const handleRetryClick = (event) => {
		event.preventDefault();
		reconnect();
	};

	return <div className='ConnectionStatusAlert' role='alert'>
		<strong>
			<Icon iconName='warning' /> {t('meteor_status', { context: status })}
		</strong>

		{status === 'waiting' && <>
			{' '}
			{t('meteor_status_reconnect_in', { count: reconnectCountdown })}
		</>}

		{['waiting', 'offline'].includes(status) && <>
			{' '}
			<a
				href='#'
				className='ConnectionStatusAlert__link'
				onClick={handleRetryClick}
			>
				{t('meteor_status_try_now', { context: status })}
			</a>
		</>}
	</div>;
}
