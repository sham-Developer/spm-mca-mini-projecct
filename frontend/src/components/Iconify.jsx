import React from 'react';
import { Icon } from '@iconify/react';

// Maps Lucide icon names to curated Iconify icons (lucide:* collection)
const iconMap = {
  AlertCircle: 'lucide:alert-circle',
  ArrowLeft: 'lucide:arrow-left',
  ArrowRight: 'lucide:arrow-right',
  ArrowUpRight: 'lucide:arrow-up-right',
  BarChart2: 'lucide:bar-chart-2',
  Bell: 'lucide:bell',
  BookOpen: 'lucide:book-open',
  Briefcase: 'lucide:briefcase',
  Building: 'lucide:building',
  Calendar: 'lucide:calendar',
  CalendarCheck: 'lucide:calendar-check',
  CalendarDays: 'lucide:calendar-days',
  CalendarRange: 'lucide:calendar-range',
  Check: 'lucide:check',
  CheckCircle: 'lucide:check-circle',
  CheckCircle2: 'lucide:check-circle-2',
  CheckSquare: 'lucide:check-square',
  ChevronDown: 'lucide:chevron-down',
  ChevronLeft: 'lucide:chevron-left',
  ChevronRight: 'lucide:chevron-right',
  ClipboardList: 'lucide:clipboard-list',
  Clock: 'lucide:clock',
  Columns: 'lucide:columns-3',
  Copy: 'lucide:copy',
  DollarSign: 'lucide:dollar-sign',
  Download: 'lucide:download',
  Edit: 'lucide:edit',
  Edit3: 'lucide:edit-3',
  ExternalLink: 'lucide:external-link',
  Eye: 'lucide:eye',
  EyeOff: 'lucide:eye-off',
  FileCheck: 'lucide:file-check',
  FileSpreadsheet: 'lucide:file-spreadsheet',
  FileText: 'lucide:file-text',
  Filter: 'lucide:filter',
  FilterX: 'lucide:filter-x',
  FolderKanban: 'lucide:folder-kanban',
  FolderPlus: 'lucide:folder-plus',
  Heart: 'lucide:heart',
  History: 'lucide:history',
  IndianRupee: 'lucide:indian-rupee',
  Info: 'lucide:info',
  Layers: 'lucide:layers',
  LayoutDashboard: 'lucide:layout-dashboard',
  LayoutGrid: 'lucide:layout-grid',
  ListFilter: 'lucide:list-filter',
  Lock: 'lucide:lock',
  LogIn: 'lucide:log-in',
  LogOut: 'lucide:log-out',
  Mail: 'lucide:mail',
  MapPin: 'lucide:map-pin',
  Menu: 'lucide:menu',
  MessageSquare: 'lucide:message-square',
  MoreVertical: 'lucide:more-vertical',
  Paperclip: 'lucide:paperclip',
  Phone: 'lucide:phone',
  PieChart: 'lucide:pie-chart',
  Plus: 'lucide:plus',
  RefreshCw: 'lucide:refresh-cw',
  Search: 'lucide:search',
  Send: 'lucide:send',
  Server: 'lucide:server',
  Shield: 'lucide:shield',
  ShieldCheck: 'lucide:shield-check',
  Sliders: 'lucide:sliders',
  Sun: 'lucide:sun',
  Sunset: 'lucide:sunset',
  Timer: 'lucide:timer',
  Trash2: 'lucide:trash-2',
  TrendingUp: 'lucide:trending-up',
  Upload: 'lucide:upload',
  User: 'lucide:user',
  UserCheck: 'lucide:user-check',
  UserPlus: 'lucide:user-plus',
  Users: 'lucide:users',
  X: 'lucide:x',
  XCircle: 'lucide:x-circle'
};

/**
 * Creates an Iconify wrapper component matching Lucide React signature:
 * <IconName size={18} className="..." />
 */
function createIcon(name) {
  const iconId = iconMap[name] || `lucide:${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;

  const Component = ({ size = 24, className = '', style = {}, ...props }) => {
    return (
      <Icon
        icon={iconId}
        width={size}
        height={size}
        className={className}
        style={style}
        {...props}
      />
    );
  };
  Component.displayName = `Iconify_${name}`;
  return Component;
}

export const AlertCircle = createIcon('AlertCircle');
export const ArrowLeft = createIcon('ArrowLeft');
export const ArrowRight = createIcon('ArrowRight');
export const ArrowUpRight = createIcon('ArrowUpRight');
export const BarChart2 = createIcon('BarChart2');
export const Bell = createIcon('Bell');
export const BookOpen = createIcon('BookOpen');
export const Briefcase = createIcon('Briefcase');
export const Building = createIcon('Building');
export const Calendar = createIcon('Calendar');
export const CalendarCheck = createIcon('CalendarCheck');
export const CalendarDays = createIcon('CalendarDays');
export const CalendarRange = createIcon('CalendarRange');
export const Check = createIcon('Check');
export const CheckCircle = createIcon('CheckCircle');
export const CheckCircle2 = createIcon('CheckCircle2');
export const CheckSquare = createIcon('CheckSquare');
export const ChevronDown = createIcon('ChevronDown');
export const ChevronLeft = createIcon('ChevronLeft');
export const ChevronRight = createIcon('ChevronRight');
export const ClipboardList = createIcon('ClipboardList');
export const Clock = createIcon('Clock');
export const Columns = createIcon('Columns');
export const Copy = createIcon('Copy');
export const DollarSign = createIcon('DollarSign');
export const Download = createIcon('Download');
export const Edit = createIcon('Edit');
export const Edit3 = createIcon('Edit3');
export const ExternalLink = createIcon('ExternalLink');
export const Eye = createIcon('Eye');
export const EyeOff = createIcon('EyeOff');
export const FileCheck = createIcon('FileCheck');
export const FileSpreadsheet = createIcon('FileSpreadsheet');
export const FileText = createIcon('FileText');
export const Filter = createIcon('Filter');
export const FilterX = createIcon('FilterX');
export const FolderKanban = createIcon('FolderKanban');
export const FolderPlus = createIcon('FolderPlus');
export const Heart = createIcon('Heart');
export const History = createIcon('History');
export const IndianRupee = createIcon('IndianRupee');
export const Info = createIcon('Info');
export const Layers = createIcon('Layers');
export const LayoutDashboard = createIcon('LayoutDashboard');
export const LayoutGrid = createIcon('LayoutGrid');
export const ListFilter = createIcon('ListFilter');
export const Lock = createIcon('Lock');
export const LogIn = createIcon('LogIn');
export const LogOut = createIcon('LogOut');
export const Mail = createIcon('Mail');
export const MapPin = createIcon('MapPin');
export const Menu = createIcon('Menu');
export const MessageSquare = createIcon('MessageSquare');
export const MoreVertical = createIcon('MoreVertical');
export const Paperclip = createIcon('Paperclip');
export const Phone = createIcon('Phone');
export const PieChart = createIcon('PieChart');
export const Plus = createIcon('Plus');
export const RefreshCw = createIcon('RefreshCw');
export const Search = createIcon('Search');
export const Send = createIcon('Send');
export const Server = createIcon('Server');
export const Shield = createIcon('Shield');
export const ShieldCheck = createIcon('ShieldCheck');
export const Sliders = createIcon('Sliders');
export const Sun = createIcon('Sun');
export const Sunset = createIcon('Sunset');
export const Timer = createIcon('Timer');
export const Trash2 = createIcon('Trash2');
export const TrendingUp = createIcon('TrendingUp');
export const Upload = createIcon('Upload');
export const User = createIcon('User');
export const UserCheck = createIcon('UserCheck');
export const UserPlus = createIcon('UserPlus');
export const Users = createIcon('Users');
export const X = createIcon('X');
export const XCircle = createIcon('XCircle');

export default createIcon;
