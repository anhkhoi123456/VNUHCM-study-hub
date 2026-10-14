#include "login.hpp"
#include <sqlite3.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/crypto.h>
#include <array>
#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <memory>

namespace {
constexpr int iterations = 600000;
using Database = std::unique_ptr<sqlite3, decltype(&sqlite3_close)>;
using Statement = std::unique_ptr<sqlite3_stmt, decltype(&sqlite3_finalize)>;
Database open(const std::string& path) {
    sqlite3* raw = nullptr;
    if (sqlite3_open(path.c_str(), &raw) != SQLITE_OK) { if (raw) sqlite3_close(raw); throw std::runtime_error("Cannot open database"); }
    Database db(raw, sqlite3_close);
    sqlite3_busy_timeout(db.get(), 5000);
    return db;
}
Statement prepare(sqlite3* db, const char* sql) {
    sqlite3_stmt* raw = nullptr;
    if (sqlite3_prepare_v2(db, sql, -1, &raw, nullptr) != SQLITE_OK) throw std::runtime_error("Database error");
    return Statement(raw, sqlite3_finalize);
}
std::array<unsigned char, 32> derive(const std::string& password, const unsigned char* salt) {
    std::array<unsigned char, 32> result{};
    if (PKCS5_PBKDF2_HMAC(password.data(), static_cast<int>(password.size()), salt, 16, iterations, EVP_sha256(), 32, result.data()) != 1) throw std::runtime_error("Password hashing failed");
    return result;
}
bool valid(const std::string& username, const std::string& password) {
    return !username.empty() && username.size() <= 254 && password.size() >= 8 && password.size() <= 1024;
}
void bind(sqlite3_stmt* stmt, int index, const std::string& value) { sqlite3_bind_text(stmt, index, value.data(), static_cast<int>(value.size()), SQLITE_TRANSIENT); }
}

namespace studyhub {
void initialize(const std::string& database) {
    auto db = open(database);
    if (sqlite3_exec(db.get(), "CREATE TABLE IF NOT EXISTS users(username TEXT PRIMARY KEY, salt BLOB NOT NULL, password_hash BLOB NOT NULL)", nullptr, nullptr, nullptr) != SQLITE_OK) throw std::runtime_error("Cannot initialize users");
}
bool create_user(const std::string& database, const std::string& username, const std::string& password) {
    if (!valid(username, password)) return false;
    auto db = open(database);
    auto stmt = prepare(db.get(), "INSERT INTO users(username,salt,password_hash) VALUES(?,?,?)");
    std::array<unsigned char, 16> salt{};
    if (RAND_bytes(salt.data(), 16) != 1) throw std::runtime_error("Random generation failed");
    auto hash = derive(password, salt.data());
    bind(stmt.get(), 1, username);
    sqlite3_bind_blob(stmt.get(), 2, salt.data(), 16, SQLITE_TRANSIENT);
    sqlite3_bind_blob(stmt.get(), 3, hash.data(), 32, SQLITE_TRANSIENT);
    return sqlite3_step(stmt.get()) == SQLITE_DONE;
}
bool verify_user(const std::string& database, const std::string& username, const std::string& password) {
    auto db = open(database);
    auto stmt = prepare(db.get(), "SELECT salt,password_hash FROM users WHERE username=?");
    bind(stmt.get(), 1, username);
    std::array<unsigned char, 16> salt{};
    std::array<unsigned char, 32> expected{};
    bool found = sqlite3_step(stmt.get()) == SQLITE_ROW;
    if (found) {
        if (sqlite3_column_bytes(stmt.get(), 0) != 16 || sqlite3_column_bytes(stmt.get(), 1) != 32) throw std::runtime_error("Invalid credential record");
        std::copy_n(static_cast<const unsigned char*>(sqlite3_column_blob(stmt.get(), 0)), 16, salt.begin());
        std::copy_n(static_cast<const unsigned char*>(sqlite3_column_blob(stmt.get(), 1)), 32, expected.begin());
    }
    auto actual = derive(password, salt.data()); // Same hash work for unknown users.
    return found && CRYPTO_memcmp(actual.data(), expected.data(), 32) == 0;
}
bool change_password(const std::string& database, const std::string& username, const std::string& current, const std::string& next) {
    if (!valid(username, next) || !verify_user(database, username, current)) return false;
    auto db = open(database);
    std::array<unsigned char, 16> salt{};
    if (RAND_bytes(salt.data(), 16) != 1) throw std::runtime_error("Random generation failed");
    auto hash = derive(next, salt.data());
    auto stmt = prepare(db.get(), "UPDATE users SET salt=?,password_hash=? WHERE username=?");
    sqlite3_bind_blob(stmt.get(), 1, salt.data(), 16, SQLITE_TRANSIENT);
    sqlite3_bind_blob(stmt.get(), 2, hash.data(), 32, SQLITE_TRANSIENT);
    bind(stmt.get(), 3, username);
    return sqlite3_step(stmt.get()) == SQLITE_DONE && sqlite3_changes(db.get()) == 1;
}
}

// Credentials arrive through stdin, never process arguments or logs.
int main(int argc, char** argv) {
    try {
        if (argc != 3) return 2;
        const std::string operation = argv[1], database = argv[2];
        studyhub::initialize(database);
        if (operation == "init") return 0;
        std::string username, password, next;
        std::getline(std::cin, username); std::getline(std::cin, password);
        bool success = false;
        if (operation == "create") success = studyhub::create_user(database, username, password);
        else if (operation == "verify") success = studyhub::verify_user(database, username, password);
        else if (operation == "change") { std::getline(std::cin, next); success = studyhub::change_password(database, username, password, next); }
        return success ? 0 : 1;
    } catch (...) { std::cerr << "Authentication service error\n"; return 2; }
}
