import { CHROMA, clock as hhmm, countdown, drinkById, serviceById, STEP_LABEL, stylistById } from '@ilker/shared';
import { router } from 'expo-router';
import { View } from 'react-native';

import { QrCode, Ring } from '../components/Art';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { useToast } from '../components/Toast';
import { Button, Glass, LiveDot, Press, Row, Tag, Txt } from '../components/ui';
import { useDemo } from '../state/demo';
import { useVisit } from '../state/live';
import { C, fx, R } from '../theme';

/** Feature 9: the visit live. Check in with a QR code, the processing time ticking, and a heads-up when your stylist runs late. */
export default function LiveVisit() {
  const v = useVisit();
  const { live, checkIn, speedUp, consult } = useDemo();
  const toast = useToast();
  const stylist = stylistById(v.appt.stylist);
  const service = serviceById(v.appt.service);
  const chroma = CHROMA[stylist.chroma];
  const processing = v.step?.kind === 'inwerken';
  const drink = live.drink ? drinkById(live.drink.id) : null;

  return (
    <Screen back title={service.short} kicker={`Live · ${stylist.name} · stoel ${v.appt.chair + 1}`}>
      {v.late > 0 && v.phase !== 'now' && v.phase !== 'done' ? (
        <View {...fx('glass-strong')} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(242,36,60,0.45)' }}>
          <LiveDot alert />
          <View style={{ flex: 1 }}>
            <Txt v="h3">{stylist.name} loopt {v.late} minuten uit</Txt>
            <Txt v="small" color={C.soft}>
              Je bent om {hhmm(v.appt.begin)} aan de beurt in plaats van {hhmm(v.appt.start)}. Neem gerust de tijd.
            </Txt>
          </View>
        </View>
      ) : null}

      {v.phase === 'later' && !v.checkedIn ? (
        <Glass style={{ alignItems: 'center', gap: 16 }} pad={22}>
          <Txt v="label" color={C.muted}>
            Check in bij de balie
          </Txt>
          <View style={{ padding: 16, borderRadius: 22, backgroundColor: C.cream }}>
            <QrCode seed={v.appt.start.getHours() * 7 + 3} size={190} />
          </View>
          <Txt v="body" color={C.soft} align="center">
            Laat deze code scannen als je binnenkomt, of check zelf in zodra je er bent.
          </Txt>
          <Button
            title="Ik ben er · check in"
            icon="check"
            full
            onPress={() => {
              checkIn();
              toast('Je bent ingecheckt', { text: `${stylist.name} weet dat je er bent.`, icon: 'check' });
            }}
          />
        </Glass>
      ) : null}

      {(v.phase === 'later' && v.checkedIn) || v.phase === 'waiting' ? (
        <Glass style={{ alignItems: 'center', gap: 12 }} pad={22} tint={stylist.chroma}>
          <Tag label={`Ingecheckt om ${live.checkedIn ? hhmm(live.checkedIn) : ''}`} color={C.white} bg={C.ok} />
          <Txt v="title" align="center">
            Neem plaats in de wachtruimte
          </Txt>
          <Txt v="timer" ink={stylist.chroma}>
            {countdown(Math.max(0, v.until))}
          </Txt>
          <Txt v="body" color={C.soft} align="center">
            {stylist.name} haalt je om {hhmm(v.appt.begin)} op voor stoel {v.appt.chair + 1}.
          </Txt>
        </Glass>
      ) : null}

      {v.phase === 'now' && v.step ? (
        <Glass style={{ alignItems: 'center', gap: 14 }} pad={22} tint={stylist.chroma}>
          <Row gap={8}>
            <LiveDot />
            <Txt v="label" color={C.soft}>
              {v.step.station === 'basin' ? 'Bij de wasbak' : `In stoel ${v.appt.chair + 1}`}
            </Txt>
          </Row>
          <Ring value={processing ? 1 - v.stepLeft / (v.step.minutes * 60000) : v.progress} size={230} stroke={14} chroma={stylist.chroma}>
            <View style={{ alignItems: 'center', gap: 2 }}>
              <Txt v="label" color={C.muted}>
                {STEP_LABEL[v.step.kind]}
              </Txt>
              <Txt v="timer" size={56}>
                {countdown(v.stepLeft)}
              </Txt>
              <Txt v="small" color={C.muted}>
                {processing ? 'inwerktijd over' : 'deze stap'}
              </Txt>
            </View>
          </Ring>
          <Txt v="body" color={C.soft} align="center">
            {processing
              ? 'Je kleur werkt in. Ontspan: je drankje komt naar je stoel.'
              : `Klaar rond ${hhmm(v.appt.end)}. ${Math.round(v.progress * 100)}% van je afspraak is voorbij.`}
          </Txt>
        </Glass>
      ) : null}

      {v.phase === 'done' ? (
        <Glass style={{ alignItems: 'center', gap: 12 }} pad={22} tint="honing">
          <View {...fx('dye-chroma')} style={{ width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blue }}>
            <Icon name="sparkle" size={30} color="#FFFFFF" />
          </View>
          <Txt v="title" align="center">
            Klaar. Wat mooi.
          </Txt>
          <Txt v="body" color={C.soft} align="center">
            Reken af in de app, met een fooi voor {stylist.name} als je wilt, en laat je nieuwe kleur zien.
          </Txt>
          <Row gap={10}>
            <Button title="Betalen & fooi" icon="card" onPress={() => router.push('/betalen')} />
            <Button title="Review" icon="camera" kind="glass" onPress={() => router.push('/review')} />
          </Row>
        </Glass>
      ) : null}

      <Glass pad={16} style={{ gap: 2 }}>
        <Txt v="label" color={C.muted} style={{ marginBottom: 8 }}>
          Je afspraak, stap voor stap
        </Txt>
        {v.appt.steps.map((s, i) => {
          const done = v.now.getTime() >= s.end.getTime();
          const active = v.step === s || (v.step && v.step.start.getTime() === s.start.getTime());
          return (
            <Row key={i} gap={12} style={{ paddingVertical: 9, opacity: done ? 0.55 : 1 }}>
              <View
                {...fx(active ? `dye-${stylist.chroma}` : '')}
                style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? chroma.stops[1] : done ? 'rgba(91,227,166,0.18)' : 'rgba(16,28,72,0.06)' }}
              >
                <Icon name={done ? 'check' : s.station === 'basin' ? 'wash' : s.kind === 'inwerken' ? 'timer' : 'chair'} size={15} color={active ? '#140C10' : done ? C.ok : C.soft} />
              </View>
              <Txt v="h3" size={15} style={{ flex: 1 }}>
                {STEP_LABEL[s.kind]}
              </Txt>
              <Txt v="num" size={13} color={C.muted}>
                {hhmm(s.start)} · {s.minutes} min
              </Txt>
            </Row>
          );
        })}
      </Glass>

      <Row gap={10}>
        <Press onPress={() => router.push('/drankje')} fxNames="glass" style={{ flex: 1, padding: 16, gap: 8, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)' }}>
          <Icon name="cup" size={22} color={C.blue} />
          <Txt v="h3" size={15}>
            {drink ? drink.name : 'Drankje bestellen'}
          </Txt>
          <Txt v="small" color={C.muted}>
            {drink ? 'Komt naar je stoel' : 'Naar je stoel gebracht'}
          </Txt>
        </Press>
        <Press onPress={() => router.push('/consult')} fxNames="glass" style={{ flex: 1, padding: 16, gap: 8, borderRadius: R.md, borderWidth: 1, borderColor: 'rgba(16,28,72,0.12)' }}>
          <Icon name="camera" size={22} color={C.blue} />
          <Txt v="h3" size={15}>
            Consult-foto's
          </Txt>
          <Txt v="small" color={C.muted}>
            {live.consultSent || consult.sent ? `${stylist.name} heeft ze gezien` : 'Nog niet gestuurd'}
          </Txt>
        </Press>
      </Row>

      {v.phase !== 'done' ? (
        <View style={{ gap: 8 }}>
          <Txt v="label" color={C.faint}>
            Demo
          </Txt>
          <Row gap={8} wrap>
            {v.phase !== 'now' ? (
              <Button title="Begin nu" icon="play" kind="glass" size="sm" onPress={() => speedUp(Math.max(0, Math.ceil(v.until / 60000)))} />
            ) : null}
            <Button title="5 min vooruit" icon="refresh" kind="glass" size="sm" onPress={() => speedUp(5)} />
            <Button title="Naar het eind" icon="arrow" kind="glass" size="sm" onPress={() => speedUp(Math.ceil((v.appt.end.getTime() - v.now.getTime()) / 60000) + 1)} />
          </Row>
          <Txt v="small" color={C.faint}>
            Spoelt alleen jouw afspraak door; de salon in het beheer volgt mee.
          </Txt>
        </View>
      ) : null}
    </Screen>
  );
}
