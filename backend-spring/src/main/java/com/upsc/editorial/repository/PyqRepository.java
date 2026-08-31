package com.upsc.editorial.repository;

import com.upsc.editorial.model.Pyq;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PyqRepository extends JpaRepository<Pyq, Long> {
    List<Pyq> findByGsPaperOrderByYearDesc(String gsPaper);
    List<Pyq> findBySyllabusTopicId(Long syllabusTopicId);
}
