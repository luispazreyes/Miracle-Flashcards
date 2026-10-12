import {
  pullResponseSchema,
  pushResponseSchema,
  type PullResponse,
  type PushRequest,
  type PushResponse,
  type SyncRemote,
} from '../contract'
import { MockServer } from './server'

/** Controles de prueba/demostración: latencia, fallos y respuestas perdidas. */
export interface MockControls {
  latencyMs: number
  /** Las próximas N llamadas fallan sin llegar al servidor. */
  failNext: number
  /** Las próximas N llamadas a `push` llegan al servidor, pero la respuesta se pierde (corte a mitad). */
  loseResponseNext: number
}

/**
 * Implementación mock de `SyncRemote`. Cada instancia es un "dispositivo" de un usuario; varias instancias
 * pueden compartir el mismo `MockServer` para simular un segundo dispositivo.
 */
export class MockSyncRemote implements SyncRemote {
  readonly controls: MockControls = { latencyMs: 0, failNext: 0, loseResponseNext: 0 }
  /** Contadores de llamadas (para pruebas). */
  calls = { push: 0, pull: 0 }

  constructor(
    private readonly server: MockServer,
    private readonly userId: string,
  ) {}

  private async enter() {
    if (this.controls.latencyMs > 0)
      await new Promise((r) => setTimeout(r, this.controls.latencyMs))
    if (this.controls.failNext > 0) {
      this.controls.failNext--
      throw new Error('Fallo de red simulado')
    }
  }

  async push(request: PushRequest): Promise<PushResponse> {
    this.calls.push++
    await this.enter()
    const response = this.server.push(this.userId, request.ops)
    if (this.controls.loseResponseNext > 0) {
      this.controls.loseResponseNext--
      throw new Error('Respuesta perdida simulada')
    }
    return pushResponseSchema.parse(response)
  }

  async pull(cursor: number): Promise<PullResponse> {
    this.calls.pull++
    await this.enter()
    return pullResponseSchema.parse(this.server.pull(this.userId, cursor))
  }
}
