package org.mefee

import io.ktor.application.Application
import io.ktor.application.install
import io.ktor.features.CallLogging
import io.ktor.features.DefaultHeaders
import io.ktor.http.content.default
import io.ktor.http.content.files
import io.ktor.http.content.static
import io.ktor.routing.routing

fun Application.main() {
    install(DefaultHeaders)
    install(CallLogging)

    routing {
        static {
            files("public")
            default("public/index.html")
        }
    }
}