import { countdown, drinkById, STEP_LABEL, stylistById, clock as hhmm } from '@ilker/shared';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDemo } from '../state/demo';
import { useVisit } from '../state/live';
import { C, fx, isWeb } from '../theme';
import { Icon } from './Icon';
import { LiveDot, Press, Txt } from './ui';

/**
 * A live pill at the top of the tabs, like the Dynamic Island: your stylist running late, the processing time ticking
 * down while you sit, your place in the walk-in queue, or your drink on its way.
 */
export function LiveIsland() {
  const insets = useSafeAreaInsets();
  const { live } = useDemo();
  const v = useVisit();
  const stylist = stylistById(v.appt.stylist).name;
  let line: { icon: 'timer' | 'clock' | 'door' | 'cup'; title: string; value?: string; to: '/live' | '/salon' | '/drankje'; alert?: boolean } | null = null;

  const drinkAge = live.drink ? v.now.getTime() - live.drink.at.getTime() : Infinity;
  if (v.phase === 'now' && v.step) {
    line = { icon: 'timer', title: STEP_LABEL[v.step.kind], value: countdown(v.stepLeft), to: '/live' };
  } else if (v.phase === 'waiting' || (v.phase === 'later' && v.until < 75 * 60000 && v.until > -5 * 60000)) {
    line = {
      icon: 'clock',
      title: v.late ? `${stylist} loopt ${v.late} min uit` : `${stylist} om ${hhmm(v.appt.begin)}`,
      value: v.until > 0 ? countdown(v.until) : 'nu',
      to: '/live',
      alert: v.late > 0,
    };
  } else if (live.walkIn) {
    const left = Math.max(0, live.walkIn.wait * 60000 - (v.now.getTime() - live.walkIn.at.getTime()));
    line = { icon: 'door', title: 'In de inloopwachtrij', value: `± ${Math.max(1, Math.round(left / 60000))} min`, to: '/salon' };
  }
  if (live.drink && drinkAge < 4 * 60000 && (!line || line.icon !== 'timer')) {
    line = { icon: 'cup', title: `${drinkById(live.drink.id).name} ${drinkAge < 60000 ? 'besteld' : drinkAge < 180000 ? 'wordt gemaakt' : 'komt eraan'}`, to: '/drankje' };
  }
  if (!line) return null;
  const target = line.to;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}>
      <Press
        onPress={() => router.push(target)}
        accessibilityLabel={`${line.title}${line.value ? `, ${line.value}` : ''}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingLeft: 12,
          paddingRight: 14,
          height: 40,
          borderRadius: 20,
          backgroundColor: isWeb ? 'rgba(14,22,48,0.9)' : '#0E1630',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
        }}
      >
        <LiveDot alert={line.alert} />
        <Icon name={line.icon} size={16} color={C.white} />
        <Txt v="small" weight="600" color={C.white}>
          {line.title}
        </Txt>
        {line.value ? (
          <Txt v="num" size={13} color="#AFC0FF">
            {line.value}
          </Txt>
        ) : null}
      </Press>
    </View>
  );
}
