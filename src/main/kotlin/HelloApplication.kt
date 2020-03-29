package org.mefee

import io.ktor.application.Application
import io.ktor.application.call
import io.ktor.application.install
import io.ktor.features.CallLogging
import io.ktor.features.DefaultHeaders
import io.ktor.http.content.default
import io.ktor.http.content.files
import io.ktor.http.content.static
import io.ktor.request.receiveText
import io.ktor.response.respond
import io.ktor.routing.get
import io.ktor.routing.post
import io.ktor.routing.route
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
        route("/api/v1/data") {
            get {
                val userId = call.request.headers["Authentication"]
                if (!userId.isNullOrBlank()) {
                    lateinit var result: String
                    transaction {
                        result = Data.select { Data.id eq userId }.single()[Data.data]
                    }
                    call.respond(result)
                } else {
                    call.respond(403)
                }
            }
            post {
                val userId = call.request.headers["Authentication"]
                if (!userId.isNullOrBlank()) {
                    val userData = call.receiveText()
                    transaction {
                        if (Data.select { Data.id eq userId }.singleOrNull() == null) {
                            Data.insert {
                                it[id] = userId
                                it[data] = userData
                            }
                        } else {
                            Data.update({ Data.id eq userId }) {
                                it[data] = userData
                            }
                        }
                    }
                } else {
                    call.respond(403)
                }
            }
        }
        static {
            files("public")
            default("public/index.html")
        }
    }

    val databaseHost = System.getenv("POSTGRES_HOST")
    val databasePassword = System.getenv("POSTGRES_PASSWORD")
    Database.connect("jdbc:postgresql://$databaseHost:5432/postgres",
            driver = "org.postgresql.Driver",
            user = "postgres",
            password = databasePassword)

    transaction {
        addLogger(Slf4jSqlDebugLogger)
        SchemaUtils.createMissingTablesAndColumns(Data)
        println(id)
    }
}