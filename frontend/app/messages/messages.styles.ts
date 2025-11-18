import { StyleSheet } from 'react-native';

const BG = '#FFF7F7';
const TEXT = '#231F20';
const SUB = '#7A6F6F';
const ACCENT = '#A2172C';

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '800',
    color: TEXT,
    fontSize: 16,
  },
  row: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  left: { alignItems: 'flex-start' },
  right: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
  },
  msgText: {
    color: TEXT,
    fontSize: 16,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 6,
    marginTop: 4,
  },
  edited: { color: SUB, fontSize: 10 },
  time: { color: SUB, fontSize: 10 },
  replyWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  replyBar: {
    width: 3,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  replyName: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT,
  },
  replySnippet: {
    fontSize: 12,
    color: SUB,
  },
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 72,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTitle: { fontWeight: '800', color: TEXT },
  barSnippet: { color: SUB, marginTop: 2 },
  barClose: { padding: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
    backgroundColor: BG,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    color: TEXT,
  },
  send: {
    backgroundColor: ACCENT,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  menu: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 72,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  menuText: {
    color: TEXT,
    fontWeight: '700',
  },
});
