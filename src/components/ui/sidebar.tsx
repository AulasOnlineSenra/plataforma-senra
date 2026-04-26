"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContext = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [openMobile, setOpenMobile] = React.useState(false)

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen)
    const open = openProp ?? _open
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value
        if (setOpenProp) {
          setOpenProp(openState)
        } else {
          _setOpen(openState)
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
      },
      [setOpenProp, open]
    )

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile
        ? setOpenMobile((open) => !open)
        : setOpen((open) => !open)
    }, [isMobile, setOpen, setOpenMobile])

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault()
          toggleSidebar()
        }
      }

      window.addEventListener("keydown", handleKeyDown)
      return () => window.removeEventListener("keydown", handleKeyDown)
    }, [toggleSidebar])

    // We only want the cookie to open the sidebar on the first render on the
    // server side, and we don't want to render it again on the client.
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => {
      setMounted(true)
    }, [])
    const openOnServer = mounted && open

    const state = openOnServer ? "expanded" : "collapsed"

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        open: openOnServer,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, openOnServer, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    variant?: "sidebar" | "floating" | "inset"
    collapsible?: "offcanvas" | "icon" | "none"
  }
>(({ className, variant = "sidebar", collapsible = "offcanvas", ...props }, ref) => {
  const { state, isMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        className={cn(
          "flex h-svh w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }

  if (isMobile) {
    return (
      <Sheet open={state === "expanded"} onOpenChange={setOpen}>
        <SheetContent
          data-sidebar="sidebar"
          data-variant="mobile"
          className="w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side="left"
          {...props}
        >
          <div className="flex h-full w-[--sidebar-width-mobile] flex-col bg-sidebar text-sidebar-foreground">
            <SidebarTrigger className="absolute right-2 top-2" />
            <div className="flex h-full flex-col gap-2 overflow-y-auto px-2 py-2 data-[collapsible=icon]:hidden">
              {props.children}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      data-state={state}
      data-collapsible={collapsible}
      className={cn(
        "group peer hidden md:block",
        "transition-[width] duration-200 ease-linear",
        state === "expanded" && "[--sidebar-width:16rem]",
        state === "collapsed" && "[--sidebar-width:3rem]",
        variant === "floating" && "w-[--sidebar-width]",
        variant === "inset" && "w-[--sidebar-width]",
        className
      )}
      ref={ref}
    >
      {/* The actual sidebar. */}
      <div
        data-sidebar="sidebar"
        data-variant={variant}
        className={cn(
          "flex h-svh w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[collapsible=icon]:overflow-hidden",
          // Make the sidebar adapt to the inset variant automatically.
          variant === "inset" &&
            "[&>[data-sidebar=sidebar]]:rounded-none [&>[data-sidebar=sidebar]]:border-r [&>[data-sidebar=sidebar]]:border-sidebar-border",
          // Adjust padding for icon variant automatically.
          "group-data-[collapsible=icon]:[&>[data-sidebar=sidebar]]:p-2 group-data-[collapsible=icon]:[&>[data-sidebar=sidebar]]:px-2",
          // Hide the trigger in icon mode.
          "group-data-[collapsible=icon]:[&>[data-sidebar=trigger]]:hidden"
        )}
      >
        {/* This acts as a spacer between the trigger and the content. It's visible in expanded mode. */}
        <div
          data-sidebar="spacer"
          className="group-data-[collapsible=icon]:hidden"
        />
        <div
          data-sidebar="sidebar"
          className="flex h-full flex-col gap-2 overflow-y-auto px-2 py-2 group-data-[collapsible=icon]:[&>div]:p-2 group-data-[collapsible=icon]:[&>div]:px-2"
        >
          {props.children}
        </div>
      </div>

      {/* Sidebar trigger */}
      <div className="absolute right-3 top-3 z-10 hidden group-data-[state=collapsed]:block group-data-[collapsible=icon]:hidden">
        <SidebarTrigger />
      </div>

      {/* The scrollable area at the bottom of the sidebar. */}
      {/* This is the API for the user to add content to the sidebar. */}
      {/* <SidebarContent> is rendered at the end of the sidebar. */}
      <div
        data-sidebar="sidebar"
        className="relative flex h-full w-full flex-col bg-sidebar text-sidebar-foreground group-data-[collapsible=icon]:w-[--sidebar-width-icon]"
      >
        <div className="flex-1 overflow-auto">{/*  */}</div>
      </div>
    </div>
  )
})
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("size-9", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft className="size-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

// The header of the sidebar.
const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="sidebar-header"
        className={cn("flex flex-col gap-2 p-2", className)}
        {...props}
      />
    )
  }
)
SidebarHeader.displayName = "SidebarHeader"

// The content of the sidebar.
const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="sidebar-content"
        className={cn(
          "flex flex-col gap-2 overflow-auto p-2 group-data-[collapsible=icon]:[&>div]:p-2 group-data-[collapsible=icon]:[&>div]:px-2",
          // The spacer is rendered at the end of the sidebar.
          "[&>[data-sidebar=spacer]]:hidden",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarContent.displayName = "SidebarContent"

// The group of the sidebar.
const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="sidebar-group"
        className={cn("relative flex w-full min-w-0 flex-col", className)}
        {...props}
      />
    )
  }
)
SidebarGroup.displayName = "SidebarGroup"

// The label of the sidebar.
const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      ref={ref}
      data-sidebar="sidebar-group-label"
      className={cn(
        "flex h-8 w-full items-center px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:left-full group-data-[collapsible=icon]:top-0 group-data-[collapsible=icon]:translate-x-full group-data-[collapsible=icon]:bg-sidebar group-data-[collapsible=icon]:z-10 group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:transition-all group-data-[collapsible=icon]:duration-200 group-data-[collapsible=icon]:ease-linear group-data-[collapsible=icon]:group-hover:translate-x-0 group-data-[collapsible=icon]:group-hover:opacity-100 group-data-[state=expanded]:relative group-data-[state=expanded]:opacity-100",
        className
      )}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

// The footer of the sidebar.
const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="sidebar-footer"
        className={cn("flex flex-col gap-2 p-2", className)}
        {...props}
      />
    )
  }
)
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="sidebar-separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="sidebar-input"
      className={cn(
        "h-8 w-full bg-sidebar border-none text-sidebar shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

function setOpen(open: boolean | ((value: boolean) => boolean)) {
  throw new Error("Function not implemented.")
}

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      data-sidebar="sidebar-menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
})
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => {
  return (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:text-amber-400 focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:text-amber-400 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:text-amber-400",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:text-amber-400 hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  }
>(({ asChild = false, isActive = false, tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      ref={ref}
      data-sidebar="menu-button"
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants(), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "expanded" || isMobile}
        {...tooltip}
      />
    </TooltipContent>
    </Tooltip>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    showOnHover?: boolean
  }
>(({ asChild = false, showOnHover = false, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring transition-transform hover:text-amber-400 focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Hide the action button by default it is visible on hover.
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuAction.displayName = "SidebarMenuAction"

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md p-1 text-xs font-medium text-sidebar-accent-foreground opacity-0 group-hover/menu-item:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarMenuBadge.displayName = "SidebarMenuBadge"

const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => {
    return (
      <ul
        ref={ref}
        data-sidebar="sidebar-menu-sub"
        className={cn(
          "flex min-w-0 flex-col gap-1 border-l border-sidebar-border pl-2.5",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarMenuSub.displayName = "SidebarMenuSub"

const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => {
    return <li ref={ref} className={cn("list-none", className)} {...props} />
  }
)
SidebarMenuSubItem.displayName = "SidebarMenuSubItem"

const sidebarMenuSubButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:text-amber-400 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-8 text-sm",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    size?: "default" | "sm" | "lg"
    asChild?: boolean
  }
>(({ className, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(sidebarMenuSubButtonVariants({ size }), className)}
      {...props}
    />
  )
})
SidebarMenuSubButton.displayName = "SidebarMenuSubButton"

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle sidebar"
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 z-10 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
          "[[data-side=left]:&]:cursor-w-resize [[data-side=right]:&]:cursor-e-resize",
          "[[data-side=left]:&]:hover:text-amber-400 [[data-side=right]:&]:hover:text-amber-400",
          "[[data-side=left]:&]:after:border-l [[data-side=right]:&]:after:border-r",
          "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:text-amber-400",
          "group-data-[hoverable=true]:group-data-[collapsible=icon]:!w-[--sidebar-width-icon]",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarRail.displayName = "SidebarRail"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}