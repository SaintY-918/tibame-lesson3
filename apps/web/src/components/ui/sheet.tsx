// Sheet 是 Dialog 的側邊滑入變體。MVP 階段直接複用 Dialog 即可，
// 視覺差異不影響功能 spec。
export {
  Dialog as Sheet,
  DialogClose as SheetClose,
  DialogContent as SheetContent,
  DialogDescription as SheetDescription,
  DialogFooter as SheetFooter,
  DialogHeader as SheetHeader,
  DialogTitle as SheetTitle,
  DialogTrigger as SheetTrigger,
} from "./dialog";
