package com.upsc.editorial.repository;

import com.upsc.editorial.model.SyllabusTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SyllabusRepository extends JpaRepository<SyllabusTopic, Long> {
    Optional<SyllabusTopic> findByTopicCode(String topicCode);
    List<SyllabusTopic> findByGsPaper(String gsPaper);
}
