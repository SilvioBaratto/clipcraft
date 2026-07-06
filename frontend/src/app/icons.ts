import { LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Eye,
  Film,
  House,
  Image,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Maximize2,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  User,
  X,
  Zap,
} from 'lucide-angular';

// LucideIconProvider matches template names by converting kebab-case to PascalCase
// and looking up the result in this map's keys. `Home` is aliased to the canonical
// `House` icon (the deprecated `Home` export was removed in lucide-angular ≥ 0.477).
const icons = {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Eye,
  Film,
  Home: House,
  Image,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Maximize2,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  User,
  X,
  Zap,
};

export type IconName = keyof typeof icons;

export const ICON_PROVIDER = {
  provide: LUCIDE_ICONS,
  multi: true,
  useValue: new LucideIconProvider(icons),
};
