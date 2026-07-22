/**
 * Structured Logging Module for the Unicommerce integration.
 * Connects with the platform's operational event timeline service for auditability.
 */

import { recordEvent } from '@/lib/orchestration/events';
import type { EventDomain, EventSeverity } from '@/lib/orchestration/types';

export class UnicommerceLogger {
  private static context = 'unicommerce-integration';

  /**
   * Log an INFO level event.
   */
  static async info(
    action: string,
    message: string,
    resourceId = 'system',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const formattedMsg = `[Unicommerce][INFO] ${message}`;
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      context: this.context,
      action,
      resourceId,
      message,
      metadata,
    }));

    await recordEvent({
      domain: 'fulfillment' as EventDomain,
      severity: 'info' as EventSeverity,
      action: `unicommerce.${action}`,
      resourceType: 'unicommerce',
      resourceId,
      message: formattedMsg,
      metadata: { ...metadata, context: this.context },
    });
  }

  /**
   * Log a WARNING level event.
   */
  static async warn(
    action: string,
    message: string,
    resourceId = 'system',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const formattedMsg = `[Unicommerce][WARN] ${message}`;
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      context: this.context,
      action,
      resourceId,
      message,
      metadata,
    }));

    await recordEvent({
      domain: 'fulfillment' as EventDomain,
      severity: 'warning' as EventSeverity,
      action: `unicommerce.${action}`,
      resourceType: 'unicommerce',
      resourceId,
      message: formattedMsg,
      metadata: { ...metadata, context: this.context },
    });
  }

  /**
   * Log an ERROR level event.
   */
  static async error(
    action: string,
    message: string,
    error: any,
    resourceId = 'system',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const formattedMsg = `[Unicommerce][ERROR] ${message} - Error: ${errorMsg}`;

    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      context: this.context,
      action,
      resourceId,
      message,
      error: errorMsg,
      stack: errorStack,
      metadata,
    }));

    await recordEvent({
      domain: 'fulfillment' as EventDomain,
      severity: 'error' as EventSeverity,
      action: `unicommerce.${action}.error`,
      resourceType: 'unicommerce',
      resourceId,
      message: formattedMsg,
      metadata: {
        ...metadata,
        error: errorMsg,
        stack: errorStack,
        context: this.context,
      },
    });
  }
}
