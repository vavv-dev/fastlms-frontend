import {
  AssignmentOutlined,
  ChatOutlined,
  ElectricBoltOutlined,
  EmojiEventsOutlined,
  FactCheckOutlined,
  HtmlOutlined,
  LibraryBooksOutlined,
  LiveTvOutlined,
  MenuBookOutlined,
  NoteAltOutlined,
  NoteOutlined,
  NotificationsOutlined,
  PictureAsPdfOutlined,
  PlaylistPlayOutlined,
  PollOutlined,
  QuizOutlined,
  RuleOutlined,
  SchoolOutlined,
  SmartDisplayOutlined,
  SvgIconComponent,
} from '@mui/icons-material';
import { SvgIconProps, Tooltip } from '@mui/material';

interface TooltipIconProps extends SvgIconProps {
  kind: string;
  t: (key: string, options?: { ns: string }) => string;
  tooltip?: string | undefined;
}

export const TooltipIcon = ({ kind, t, tooltip, ...props }: TooltipIconProps) => {
  let Icon: SvgIconComponent;
  let _tooltip: string = '';

  switch (kind) {
    // video
    case 'short':
      Icon = ElectricBoltOutlined;
      _tooltip = t('Short', { ns: 'share' });
      break;
    case 'live':
      Icon = LiveTvOutlined;
      _tooltip = t('Live', { ns: 'share' });
      break;
    case 'video':
      Icon = SmartDisplayOutlined;
      _tooltip = t('Video', { ns: 'share' });
      break;

    case 'playlist':
      Icon = PlaylistPlayOutlined;
      _tooltip = t('Playlist', { ns: 'share' });
      break;

    // asset
    case 'asset':
    case 'pdf':
      Icon = PictureAsPdfOutlined;
      _tooltip = t('PDF', { ns: 'share' });
      break;
    case 'epub':
      Icon = MenuBookOutlined;
      _tooltip = t('EPUB', { ns: 'share' });
      break;
    case 'html':
      Icon = HtmlOutlined;
      _tooltip = t('HTML', { ns: 'share' });
      break;

    case 'quiz':
      Icon = QuizOutlined;
      _tooltip = t('Quiz', { ns: 'share' });
      break;
    case 'survey':
      Icon = PollOutlined;
      _tooltip = t('Survey', { ns: 'share' });
      break;

    // exam
    case 'midterm_exam':
      Icon = RuleOutlined;
      _tooltip = t('Midterm Exam', { ns: 'share' });
      break;
    case 'final_exam':
      Icon = FactCheckOutlined;
      _tooltip = t('Final Exam', { ns: 'share' });
      break;
    case 'assignment':
      Icon = NoteAltOutlined;
      _tooltip = t('Assignment', { ns: 'share' });
      break;
    case 'general_exam':
      Icon = AssignmentOutlined;
      _tooltip = t('General Exam', { ns: 'share' });
      break;

    case 'lesson':
      Icon = LibraryBooksOutlined;
      _tooltip = t('Lesson', { ns: 'share' });
      break;
    case 'course':
      Icon = SchoolOutlined;
      _tooltip = t('Course', { ns: 'share' });
      break;
    case 'comment':
      Icon = ChatOutlined;
      _tooltip = t('Comment', { ns: 'share' });
      break;
    case 'certificate':
      Icon = EmojiEventsOutlined;
      _tooltip = t('Certificate', { ns: 'share' });
      break;
    case 'notification':
      Icon = NotificationsOutlined;
      _tooltip = t('Notification', { ns: 'share' });
      break;

    default:
      Icon = NoteOutlined;
      break;
  }

  return (
    <Tooltip title={tooltip !== undefined ? tooltip : _tooltip}>
      <Icon {...props} />
    </Tooltip>
  );
};
