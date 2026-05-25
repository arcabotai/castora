'use client'

import { Web3Provider } from "@/providers/Web3Provider";
import { SelectedCastProvider } from "@/providers/SelectedCastProvider";
import { SelectedListProvider } from "@/providers/SelectedListProvider";
import { MobileSidebarProvider } from "@/providers/MobileSidebarProvider";
import { PaywallProvider } from "@/providers/PaywallProvider";
import { ImageInFocusProvider } from "@/providers/ImageInFocusProvider";
import { ClientThemeProvider } from "@/providers/ThemeProvider";
import { DeletedCastProvider } from "@/providers/DeletedCastsProvider";
import { CurrentChannelProvider } from "@/providers/CurrentChannelProvider";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { SIWFProvider } from "@/providers/SIWFProvider";
import { CSPostHogProvider } from "@/providers/PostHogProvider";
import { OpenCastModalProvider } from "@/providers/OpenCastModalProvider";
import PrivyProviderProxy from "@/providers/PrivyProvider";
import { OpenSignerApprovalProvider } from "@/providers/OpenSignerApprovalProvider";
import { SupercastUserStateProvider } from "@/providers/SupercastUserStateProvider";
import { DraftComposeWindowProvider } from "@/providers/DraftComposeWindowProvider";
import { DraftIdProvider } from "@/providers/DraftIdProvider";
import { SupercastMemberProvider } from "@/providers/SupercastMemberProvider";
import { IosPwaProvider } from "@/providers/iOSPwaProvider";
import { FeedRefreshProvider } from "@/providers/FeedRefreshProvider";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { ConfettiProvider } from "@/contexts/ConfettiContext";
import { BoxThemeProvider } from "@/providers/BoxThemeProvider";
import { OpenHotkeyShortcutWindowProvider } from "@/providers/OpenHotkeyShortcutWindow";
import { InteractionProvider } from "@/providers/InteractionProvider";
import { PWAPromptProvider } from "@/providers/PWAPromptProvider";
import { SignerApprovalDialogProvider } from "@/providers/SignerApprovalDialogProvider";
import { CheckoutDialogProvider } from '@/hooks/useCheckoutDialog'

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <CheckoutDialogProvider>
      <ClientThemeProvider>
        <CSPostHogProvider>
          <Web3Provider>
            <SIWFProvider>
              <PrivyProviderProxy>
                <ReactQueryProvider>
                  <SupercastUserStateProvider>
                    <IosPwaProvider>
                      <PWAPromptProvider>
                        <FeedRefreshProvider>
                          <DeletedCastProvider>
                            <SelectedCastProvider>
                              <OpenCastModalProvider>
                                <OpenSignerApprovalProvider>
                                  <SignerApprovalDialogProvider>
                                    <SelectedListProvider>
                                      <CurrentChannelProvider>
                                        <MobileSidebarProvider>
                                          <PaywallProvider>
                                            <SupercastMemberProvider>
                                              <DraftIdProvider>
                                                <DraftComposeWindowProvider>
                                                  <OpenHotkeyShortcutWindowProvider>
                                                    <ImageInFocusProvider>
                                                      <NotificationsProvider>
                                                        <ConfettiProvider>
                                                          <BoxThemeProvider>
                                                            <InteractionProvider>
                                                              {children}
                                                            </InteractionProvider>
                                                          </BoxThemeProvider>
                                                        </ConfettiProvider>
                                                      </NotificationsProvider>
                                                    </ImageInFocusProvider>
                                                  </OpenHotkeyShortcutWindowProvider>
                                                </DraftComposeWindowProvider>
                                              </DraftIdProvider>
                                            </SupercastMemberProvider>
                                          </PaywallProvider>
                                        </MobileSidebarProvider>
                                      </CurrentChannelProvider>
                                    </SelectedListProvider>
                                  </SignerApprovalDialogProvider>
                                </OpenSignerApprovalProvider>
                              </OpenCastModalProvider>
                            </SelectedCastProvider>
                          </DeletedCastProvider>
                        </FeedRefreshProvider>
                      </PWAPromptProvider>
                    </IosPwaProvider>
                  </SupercastUserStateProvider>
                </ReactQueryProvider>
              </PrivyProviderProxy>
            </SIWFProvider>
          </Web3Provider>
        </CSPostHogProvider>
      </ClientThemeProvider>
    </CheckoutDialogProvider>
  )
}
