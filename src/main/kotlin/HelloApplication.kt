package org.mefee

import io.ktor.application.Application
import io.ktor.application.install
import io.ktor.features.CallLogging
import io.ktor.features.DefaultHeaders
import io.ktor.http.content.default
import io.ktor.http.content.files
import io.ktor.http.content.static
import io.ktor.routing.routing
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.transactions.transaction

object Data : Table() {
    val id = varchar("ID", 32)
    val data = varchar("DATA", 2048)
    override val primaryKey = PrimaryKey(id)
}

fun Application.main() {
    install(DefaultHeaders)
    install(CallLogging)

    routing {
        static {
            files("public")
            default("public/index.html")
        }
    }

    Database.connect("jdbc:postgresql://localhost:5432/postgres", driver = "org.postgresql.Driver", user = "postgres", password = "")

    transaction {
        addLogger(StdOutSqlLogger)

        SchemaUtils.createMissingTablesAndColumns(Data)
    }
}