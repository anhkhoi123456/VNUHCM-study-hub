#pragma once

#include <string>

namespace studyhub {
void initialize(const std::string& database);
bool create_user(const std::string& database, const std::string& username, const std::string& password);
bool verify_user(const std::string& database, const std::string& username, const std::string& password);
bool change_password(const std::string& database, const std::string& username, const std::string& current, const std::string& next);
}

