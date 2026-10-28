import { CARE, clock as hhmm, dayLong, euro, relativeDay, serviceById, stylistById } from '@ilker/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useWindowDimensions, View } from 'react-native';

import { Confetti, QrCode } from '../../components/Art';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { useToast } from '../../components/Toast';
import { Button, Glass, PopIn, Row, Txt } from '../../components/ui';
import { useClock } from '../../state/clock';
import { useDemo } from '../../state/demo';
import { C, fx, MAX_WIDTH } from '../../theme';

export default function Confirmed() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings } = useDemo();
  const { now } = useClock();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) {
    return (
      <Screen back title="Afspraak niet gevonden">
        <Txt color={C.soft}>Deze afspraak bestaat niet (meer) in de demo.</Txt>
        <Button title="Naar home" onPress={() => router.replace('/')} />
      </Screen>
    );
  }
  const service = serviceById(booking.service);
  const stylist = stylistById(booking.stylist);
  return (
    <Screen back>
      <View style={{ position: 'absolute', top: -40, left: -20 }}>
        <Confetti seed={booking.start.getMinutes() + 3} width={Math.min(width, MAX_WIDTH) + 40} height={260} />
      </View>
      <PopIn>
        <View style={{ alignItems: 'center', gap: 14, paddingTop: 10 }}>
          <View {...fx('dye-chroma')} style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue }}>
            <Icon name="check" size={36} color="#FFFFFF" stroke={2.4} />
          </View>
          <Txt v="display" align="center">
            Je staat erin.
          </Txt>
          <Txt v="body" color={C.soft} align="center">
            {service.short} bij {stylist.name}, {relativeDay(booking.start, now)} om {hhmm(booking.start)}.
          </Txt>
        </View>
      </PopIn>
      <Glass style={{ alignItems: 'center', gap: 14 }}>
        <View style={{ padding: 14, borderRadius: 20, backgroundColor: C.cream }}>
          <QrCode seed={booking.start.getDate() + booking.start.getHours()} size={176} />
        </View>
        <Txt v="label" color={C.muted} align="center">
          Je check-in code voor die dag
        </Txt>
        <Row gap={18}>
          <View style={{ alignItems: 'center' }}>
            <Txt v="label" color={C.muted} size={9}>
              Datum
            </Txt>
            <Txt v="h3">{dayLong(booking.start)}</Txt>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Txt v="label" color={C.muted} size={9}>
              Prijs
            </Txt>
            <Txt v="h3">{euro(booking.price)}</Txt>
          </View>
        </Row>
      </Glass>
      {service.colour ? (
        <Glass tint="violet" style={{ gap: 10 }}>
          <Txt v="h3">Laat {stylist.name.split(' ')[0]} vooraf meekijken</Txt>
          <Txt v="body" color={C.soft}>
            Stuur een foto van je haar nu en van je droomlook. Dan ligt je kleur klaar als je binnenkomt.
          </Txt>
          <Button title="Consult-foto's toevoegen" icon="camera" kind="glass" onPress={() => router.push('/consult')} />
        </Glass>
      ) : null}
      <Glass style={{ gap: 8 }}>
        <Txt v="h3">{CARE[service.care].title}: vast een tip</Txt>
        <Txt v="body" color={C.soft}>
          {CARE[service.care].intro}
        </Txt>
      </Glass>
      <Row gap={10}>
        <Button title="In mijn agenda" icon="calendar" kind="glass" onPress={() => toast('Toegevoegd aan je agenda', { text: 'Demo: er is niets echt toegevoegd.', icon: 'calendar' })} />
        <Button title="Naar home" kind="cream" onPress={() => router.replace('/')} />
      </Row>
    </Screen>
  );
}
